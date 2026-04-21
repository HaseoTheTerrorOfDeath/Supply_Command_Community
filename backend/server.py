from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── MODELS ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class PlantModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    plant_id: str = Field(default_factory=lambda: f"PLT-{uuid.uuid4().hex[:8].upper()}")
    name: str
    location: str
    type: str = "factory"
    status: str = "active"
    capacity: int = 1000
    utilization: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlantCreate(BaseModel):
    name: str
    location: str
    type: str = "factory"
    capacity: int = 1000

class InventoryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str = Field(default_factory=lambda: f"ITM-{uuid.uuid4().hex[:8].upper()}")
    name: str
    sku: str
    category: str = "raw_material"
    quantity: float = 0
    unit: str = "units"
    min_stock: float = 0
    max_stock: float = 10000
    batch_number: Optional[str] = None
    serial_number: Optional[str] = None
    expiration_date: Optional[str] = None
    plant_id: str = ""
    location_id: Optional[str] = None
    status: str = "available"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"WO-{uuid.uuid4().hex[:6].upper()}")
    product_name: str
    quantity: int
    status: str = "pending"
    priority: str = "medium"
    plant_id: str = ""
    line_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    completed_qty: int = 0
    defect_qty: int = 0
    materials_consumed: List[dict] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WarehouseLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    location_id: str = Field(default_factory=lambda: f"LOC-{uuid.uuid4().hex[:6].upper()}")
    zone: str
    aisle: str
    rack: str
    shelf: str
    plant_id: str = ""
    capacity: int = 100
    current_load: int = 0
    item_ids: List[str] = []
    status: str = "available"

class PickingOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    pick_id: str = Field(default_factory=lambda: f"PK-{uuid.uuid4().hex[:6].upper()}")
    items: List[dict] = []
    status: str = "pending"
    plant_id: str = ""
    assigned_to: Optional[str] = None
    priority: str = "normal"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Supplier(BaseModel):
    model_config = ConfigDict(extra="ignore")
    supplier_id: str = Field(default_factory=lambda: f"SUP-{uuid.uuid4().hex[:6].upper()}")
    name: str
    contact_email: str = ""
    location: str = ""
    rating: float = 4.0
    lead_time_days: int = 7
    status: str = "active"
    items_supplied: List[str] = []

class Shipment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    shipment_id: str = Field(default_factory=lambda: f"SHP-{uuid.uuid4().hex[:6].upper()}")
    supplier_id: Optional[str] = None
    origin: str = ""
    destination: str = ""
    status: str = "in_transit"
    items: List[dict] = []
    eta: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TraceabilityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    log_id: str = Field(default_factory=lambda: f"TRC-{uuid.uuid4().hex[:8].upper()}")
    item_id: str
    event_type: str
    description: str
    plant_id: str = ""
    batch_number: Optional[str] = None
    location_from: Optional[str] = None
    location_to: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    user_id: Optional[str] = None

class AutomationDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    device_id: str = Field(default_factory=lambda: f"DEV-{uuid.uuid4().hex[:6].upper()}")
    name: str
    type: str
    plant_id: str = ""
    status: str = "online"
    last_maintenance: Optional[str] = None
    uptime_hours: float = 0
    error_count: int = 0
    throughput: float = 0

# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as hclient:
        resp = await hclient.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    data = resp.json()
    email = data.get("email")
    name = data.get("name")
    picture = data.get("picture")
    session_token = data.get("session_token")
    
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name,
            "picture": picture, "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*3600
    )
    return {"user_id": user_id, "email": email, "name": name, "picture": picture}

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return UserOut(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ─── PLANTS ROUTES ────────────────────────────────────────────────────────────

@api_router.get("/plants")
async def get_plants(request: Request):
    await get_current_user(request)
    plants = await db.plants.find({}, {"_id": 0}).to_list(100)
    return plants

@api_router.post("/plants")
async def create_plant(plant: PlantCreate, request: Request):
    await get_current_user(request)
    p = PlantModel(name=plant.name, location=plant.location, type=plant.type, capacity=plant.capacity)
    doc = p.model_dump()
    await db.plants.insert_one(doc)
    return await db.plants.find_one({"plant_id": doc["plant_id"]}, {"_id": 0})

@api_router.get("/plants/{plant_id}")
async def get_plant(plant_id: str, request: Request):
    await get_current_user(request)
    plant = await db.plants.find_one({"plant_id": plant_id}, {"_id": 0})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

# ─── INVENTORY ROUTES ─────────────────────────────────────────────────────────

@api_router.get("/inventory")
async def get_inventory(request: Request, plant_id: Optional[str] = None, category: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    if category:
        query["category"] = category
    items = await db.inventory.find(query, {"_id": 0}).to_list(500)
    return items

@api_router.post("/inventory")
async def create_inventory_item(request: Request):
    await get_current_user(request)
    body = await request.json()
    item = InventoryItem(**body)
    doc = item.model_dump()
    await db.inventory.insert_one(doc)
    return await db.inventory.find_one({"item_id": doc["item_id"]}, {"_id": 0})

@api_router.put("/inventory/{item_id}")
async def update_inventory(item_id: str, request: Request):
    await get_current_user(request)
    body = await request.json()
    body.pop("item_id", None)
    await db.inventory.update_one({"item_id": item_id}, {"$set": body})
    updated = await db.inventory.find_one({"item_id": item_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated

@api_router.get("/inventory/stats")
async def inventory_stats(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    items = await db.inventory.find(query, {"_id": 0}).to_list(1000)
    total = len(items)
    low_stock = sum(1 for i in items if i.get("quantity", 0) <= i.get("min_stock", 0))
    total_value = sum(i.get("quantity", 0) for i in items)
    categories = {}
    for i in items:
        cat = i.get("category", "other")
        categories[cat] = categories.get(cat, 0) + 1
    return {"total_items": total, "low_stock_alerts": low_stock, "total_units": total_value, "by_category": categories}

# ─── PRODUCTION / WORK ORDERS ROUTES ──────────────────────────────────────────

@api_router.get("/work-orders")
async def get_work_orders(request: Request, plant_id: Optional[str] = None, status: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    if status:
        query["status"] = status
    orders = await db.work_orders.find(query, {"_id": 0}).to_list(500)
    return orders

@api_router.post("/work-orders")
async def create_work_order(request: Request):
    await get_current_user(request)
    body = await request.json()
    wo = WorkOrder(**body)
    doc = wo.model_dump()
    await db.work_orders.insert_one(doc)
    
    await db.traceability.insert_one(TraceabilityLog(
        item_id=doc["order_id"], event_type="work_order_created",
        description=f"Work order created for {doc['product_name']} x{doc['quantity']}",
        plant_id=doc.get("plant_id", "")
    ).model_dump())
    
    return await db.work_orders.find_one({"order_id": doc["order_id"]}, {"_id": 0})

@api_router.put("/work-orders/{order_id}")
async def update_work_order(order_id: str, request: Request):
    await get_current_user(request)
    body = await request.json()
    body.pop("order_id", None)
    old = await db.work_orders.find_one({"order_id": order_id}, {"_id": 0})
    await db.work_orders.update_one({"order_id": order_id}, {"$set": body})
    updated = await db.work_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    if body.get("status") and old and body["status"] != old.get("status"):
        await db.traceability.insert_one(TraceabilityLog(
            item_id=order_id, event_type="status_change",
            description=f"Work order status changed from {old.get('status')} to {body['status']}",
            plant_id=updated.get("plant_id", "")
        ).model_dump())
    
    return updated

@api_router.get("/production/stats")
async def production_stats(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    orders = await db.work_orders.find(query, {"_id": 0}).to_list(1000)
    total = len(orders)
    by_status = {}
    total_produced = 0
    total_defects = 0
    for o in orders:
        s = o.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1
        total_produced += o.get("completed_qty", 0)
        total_defects += o.get("defect_qty", 0)
    
    oee = round(random.uniform(78, 95), 1)
    return {
        "total_orders": total, "by_status": by_status,
        "total_produced": total_produced, "total_defects": total_defects,
        "oee": oee, "yield_rate": round(100 - (total_defects / max(total_produced, 1) * 100), 1)
    }

# ─── WAREHOUSE / WMS ROUTES ──────────────────────────────────────────────────

@api_router.get("/warehouse/locations")
async def get_warehouse_locations(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    locations = await db.warehouse_locations.find(query, {"_id": 0}).to_list(500)
    return locations

@api_router.post("/warehouse/locations")
async def create_warehouse_location(request: Request):
    await get_current_user(request)
    body = await request.json()
    loc = WarehouseLocation(**body)
    doc = loc.model_dump()
    await db.warehouse_locations.insert_one(doc)
    return await db.warehouse_locations.find_one({"location_id": doc["location_id"]}, {"_id": 0})

@api_router.get("/warehouse/picking-orders")
async def get_picking_orders(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    orders = await db.picking_orders.find(query, {"_id": 0}).to_list(200)
    return orders

@api_router.post("/warehouse/picking-orders")
async def create_picking_order(request: Request):
    await get_current_user(request)
    body = await request.json()
    po = PickingOrder(**body)
    doc = po.model_dump()
    await db.picking_orders.insert_one(doc)
    return await db.picking_orders.find_one({"pick_id": doc["pick_id"]}, {"_id": 0})

@api_router.get("/warehouse/stats")
async def warehouse_stats(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    locations = await db.warehouse_locations.find(query, {"_id": 0}).to_list(500)
    total_locs = len(locations)
    total_cap = sum(l.get("capacity", 0) for l in locations)
    total_load = sum(l.get("current_load", 0) for l in locations)
    utilization = round(total_load / max(total_cap, 1) * 100, 1)
    picking = await db.picking_orders.find(query, {"_id": 0}).to_list(200)
    pending_picks = sum(1 for p in picking if p.get("status") == "pending")
    return {
        "total_locations": total_locs, "total_capacity": total_cap,
        "current_load": total_load, "utilization": utilization,
        "pending_picks": pending_picks, "total_picking_orders": len(picking)
    }

# ─── SUPPLY CHAIN ROUTES ──────────────────────────────────────────────────────

@api_router.get("/suppliers")
async def get_suppliers(request: Request):
    await get_current_user(request)
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(200)
    return suppliers

@api_router.post("/suppliers")
async def create_supplier(request: Request):
    await get_current_user(request)
    body = await request.json()
    sup = Supplier(**body)
    doc = sup.model_dump()
    await db.suppliers.insert_one(doc)
    return await db.suppliers.find_one({"supplier_id": doc["supplier_id"]}, {"_id": 0})

@api_router.get("/shipments")
async def get_shipments(request: Request, status: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if status:
        query["status"] = status
    shipments = await db.shipments.find(query, {"_id": 0}).to_list(200)
    return shipments

@api_router.post("/shipments")
async def create_shipment(request: Request):
    await get_current_user(request)
    body = await request.json()
    ship = Shipment(**body)
    doc = ship.model_dump()
    await db.shipments.insert_one(doc)
    return await db.shipments.find_one({"shipment_id": doc["shipment_id"]}, {"_id": 0})

@api_router.get("/supply-chain/stats")
async def supply_chain_stats(request: Request):
    await get_current_user(request)
    suppliers = await db.suppliers.find({}, {"_id": 0}).to_list(200)
    shipments = await db.shipments.find({}, {"_id": 0}).to_list(200)
    in_transit = sum(1 for s in shipments if s.get("status") == "in_transit")
    delivered = sum(1 for s in shipments if s.get("status") == "delivered")
    return {
        "total_suppliers": len(suppliers), "total_shipments": len(shipments),
        "in_transit": in_transit, "delivered": delivered,
        "avg_lead_time": round(sum(s.get("lead_time_days", 7) for s in suppliers) / max(len(suppliers), 1), 1)
    }

# ─── TRACEABILITY ROUTES ──────────────────────────────────────────────────────

@api_router.get("/traceability")
async def get_traceability_logs(request: Request, item_id: Optional[str] = None, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if item_id:
        query["item_id"] = item_id
    if plant_id:
        query["plant_id"] = plant_id
    logs = await db.traceability.find(query, {"_id": 0}).sort("timestamp", -1).to_list(500)
    return logs

@api_router.post("/traceability")
async def create_trace_log(request: Request):
    await get_current_user(request)
    body = await request.json()
    log = TraceabilityLog(**body)
    doc = log.model_dump()
    await db.traceability.insert_one(doc)
    return await db.traceability.find_one({"log_id": doc["log_id"]}, {"_id": 0})

# ─── AUTOMATION ROUTES ─────────────────────────────────────────────────────────

@api_router.get("/automation/devices")
async def get_automation_devices(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    devices = await db.automation_devices.find(query, {"_id": 0}).to_list(100)
    return devices

@api_router.get("/automation/stats")
async def automation_stats(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    devices = await db.automation_devices.find(query, {"_id": 0}).to_list(100)
    online = sum(1 for d in devices if d.get("status") == "online")
    total_throughput = sum(d.get("throughput", 0) for d in devices)
    total_errors = sum(d.get("error_count", 0) for d in devices)
    return {
        "total_devices": len(devices), "online": online,
        "offline": len(devices) - online, "total_throughput": total_throughput,
        "total_errors": total_errors, "uptime_avg": round(sum(d.get("uptime_hours", 0) for d in devices) / max(len(devices), 1), 1)
    }

# ─── AI INTELLIGENCE ROUTES ──────────────────────────────────────────────────

@api_router.post("/intelligence/forecast")
async def demand_forecast(request: Request):
    user = await get_current_user(request)
    body = await request.json()
    product_name = body.get("product_name", "General Products")
    period = body.get("period", "next_quarter")
    
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=api_key,
            session_id=f"forecast_{uuid.uuid4().hex[:8]}",
            system_message="You are an industrial manufacturing demand forecasting AI. Provide realistic demand forecasts with specific numbers, trends, and actionable recommendations. Always respond in valid JSON format with keys: forecast_summary, monthly_predictions (array of {month, predicted_demand, confidence}), recommendations (array of strings), risk_factors (array of strings)."
        ).with_model("openai", "gpt-5.2")
        
        inventory = await db.inventory.find({}, {"_id": 0}).to_list(50)
        orders = await db.work_orders.find({}, {"_id": 0}).to_list(50)
        
        context = f"Product: {product_name}\nPeriod: {period}\nCurrent inventory items: {len(inventory)}\nActive work orders: {len(orders)}\nAvg production volume: {sum(o.get('quantity', 0) for o in orders) / max(len(orders), 1):.0f} units"
        
        msg = UserMessage(text=f"Generate a demand forecast for the following manufacturing context:\n{context}\n\nRespond ONLY with valid JSON.")
        response = await chat.send_message(msg)
        
        try:
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
                clean = clean.rsplit("```", 1)[0]
            forecast_data = json.loads(clean)
        except json.JSONDecodeError:
            forecast_data = {
                "forecast_summary": response[:500],
                "monthly_predictions": [],
                "recommendations": ["Unable to parse structured forecast"],
                "risk_factors": []
            }
        
        return {"product_name": product_name, "period": period, "forecast": forecast_data}
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/intelligence/analytics")
async def get_analytics(request: Request):
    await get_current_user(request)
    orders = await db.work_orders.find({}, {"_id": 0}).to_list(500)
    inventory = await db.inventory.find({}, {"_id": 0}).to_list(500)
    
    production_by_month = {}
    for o in orders:
        created = o.get("created_at", "")[:7]
        if created:
            production_by_month[created] = production_by_month.get(created, 0) + o.get("completed_qty", 0)
    
    low_stock = [i for i in inventory if i.get("quantity", 0) <= i.get("min_stock", 0)]
    overstock = [i for i in inventory if i.get("quantity", 0) >= i.get("max_stock", 0) * 0.9]
    
    replenishment = []
    for item in low_stock:
        replenishment.append({
            "item_id": item["item_id"], "name": item["name"],
            "current_qty": item.get("quantity", 0), "min_stock": item.get("min_stock", 0),
            "suggested_order": max(item.get("max_stock", 0) - item.get("quantity", 0), 0)
        })
    
    return {
        "production_trend": [{"month": k, "produced": v} for k, v in sorted(production_by_month.items())],
        "low_stock_items": [{"item_id": i["item_id"], "name": i["name"], "quantity": i.get("quantity", 0)} for i in low_stock[:10]],
        "overstock_items": [{"item_id": i["item_id"], "name": i["name"], "quantity": i.get("quantity", 0)} for i in overstock[:10]],
        "replenishment_suggestions": replenishment[:10]
    }

# ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

@api_router.get("/dashboard/stats")
async def dashboard_stats(request: Request, plant_id: Optional[str] = None):
    await get_current_user(request)
    query = {}
    if plant_id:
        query["plant_id"] = plant_id
    
    inventory_count = await db.inventory.count_documents(query)
    orders_count = await db.work_orders.count_documents(query)
    active_orders = await db.work_orders.count_documents({**query, "status": {"$in": ["in_progress", "pending"]}})
    devices = await db.automation_devices.find(query, {"_id": 0}).to_list(100)
    online_devices = sum(1 for d in devices if d.get("status") == "online")
    plants = await db.plants.find({}, {"_id": 0}).to_list(100)
    shipments_in_transit = await db.shipments.count_documents({"status": "in_transit"})
    
    orders = await db.work_orders.find(query, {"_id": 0}).to_list(500)
    total_produced = sum(o.get("completed_qty", 0) for o in orders)
    total_defects = sum(o.get("defect_qty", 0) for o in orders)
    
    items = await db.inventory.find(query, {"_id": 0}).to_list(500)
    low_stock = sum(1 for i in items if i.get("quantity", 0) <= i.get("min_stock", 0))
    
    return {
        "inventory_items": inventory_count,
        "total_orders": orders_count,
        "active_orders": active_orders,
        "total_produced": total_produced,
        "total_defects": total_defects,
        "oee": round(random.uniform(82, 96), 1),
        "yield_rate": round(100 - (total_defects / max(total_produced, 1) * 100), 1),
        "online_devices": online_devices,
        "total_devices": len(devices),
        "plants_count": len(plants),
        "shipments_in_transit": shipments_in_transit,
        "low_stock_alerts": low_stock
    }

# ─── SEED DATA ─────────────────────────────────────────────────────────────────

@api_router.post("/seed")
async def seed_data():
    existing = await db.plants.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "seeded": False}
    
    plants_data = [
        {"plant_id": "PLT-DETROIT01", "name": "Detroit Assembly Plant", "location": "Detroit, MI, USA", "type": "factory", "status": "active", "capacity": 5000, "utilization": 78.5, "created_at": datetime.now(timezone.utc).isoformat()},
        {"plant_id": "PLT-SHANGHAI02", "name": "Shanghai Manufacturing Hub", "location": "Shanghai, China", "type": "factory", "status": "active", "capacity": 8000, "utilization": 85.2, "created_at": datetime.now(timezone.utc).isoformat()},
        {"plant_id": "PLT-MUNICH03", "name": "Munich Precision Works", "location": "Munich, Germany", "type": "factory", "status": "active", "capacity": 3500, "utilization": 72.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"plant_id": "PLT-WHSE-TX04", "name": "Texas Distribution Center", "location": "Dallas, TX, USA", "type": "warehouse", "status": "active", "capacity": 15000, "utilization": 62.3, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.plants.insert_many(plants_data)
    
    categories = ["raw_material", "component", "finished_good", "packaging", "consumable"]
    items_data = []
    raw_materials = [
        ("Steel Plate A36", "STL-A36"), ("Aluminum Sheet 6061", "ALU-6061"), ("Copper Wire 14AWG", "COP-14A"),
        ("Titanium Bar Grade 5", "TIT-GR5"), ("Stainless Steel 304", "SS-304"), ("Carbon Fiber Sheet", "CF-001"),
        ("Rubber Seal Ring", "RBR-SL1"), ("Nylon Bushing", "NYL-BS1"), ("Silicon Wafer 8in", "SIL-8IN"),
        ("Polyethylene Pellets", "PE-PEL1")
    ]
    components = [
        ("Electric Motor 3HP", "MTR-3HP"), ("Hydraulic Pump P200", "HYD-P200"), ("PLC Controller S7-1500", "PLC-S71"),
        ("Servo Drive 5kW", "SRV-5KW"), ("Bearing SKF 6205", "BRG-6205"), ("Gearbox Ratio 10:1", "GBX-101"),
        ("Sensor Proximity 10mm", "SNS-P10"), ("Pneumatic Cylinder 100mm", "PNC-100"), ("Linear Guide Rail", "LGR-001"),
        ("Power Supply 24V", "PSU-24V")
    ]
    finished = [
        ("Assembly Module X200", "ASM-X200"), ("Control Panel CP-500", "CTL-CP5"), ("Robotic Arm Joint J3", "ROB-J3"),
        ("Conveyor Belt Section 2m", "CNV-2M"), ("Automated Feeder AF-100", "AFD-100")
    ]
    
    for idx, (name, sku) in enumerate(raw_materials):
        pid = plants_data[idx % len(plants_data)]["plant_id"]
        items_data.append({
            "item_id": f"ITM-RM{idx:03d}", "name": name, "sku": sku, "category": "raw_material",
            "quantity": random.randint(100, 5000), "unit": "kg" if idx < 6 else "pcs",
            "min_stock": random.randint(50, 200), "max_stock": random.randint(5000, 10000),
            "batch_number": f"B-{random.randint(10000, 99999)}", "expiration_date": (datetime.now(timezone.utc) + timedelta(days=random.randint(90, 365))).isoformat()[:10],
            "plant_id": pid, "status": "available", "created_at": datetime.now(timezone.utc).isoformat()
        })
    for idx, (name, sku) in enumerate(components):
        pid = plants_data[idx % len(plants_data)]["plant_id"]
        items_data.append({
            "item_id": f"ITM-CP{idx:03d}", "name": name, "sku": sku, "category": "component",
            "quantity": random.randint(20, 500), "unit": "pcs",
            "min_stock": random.randint(10, 50), "max_stock": random.randint(500, 2000),
            "serial_number": f"SN-{uuid.uuid4().hex[:10].upper()}",
            "plant_id": pid, "status": "available", "created_at": datetime.now(timezone.utc).isoformat()
        })
    for idx, (name, sku) in enumerate(finished):
        pid = plants_data[idx % len(plants_data)]["plant_id"]
        items_data.append({
            "item_id": f"ITM-FG{idx:03d}", "name": name, "sku": sku, "category": "finished_good",
            "quantity": random.randint(10, 200), "unit": "pcs",
            "min_stock": random.randint(5, 20), "max_stock": random.randint(200, 500),
            "batch_number": f"B-{random.randint(10000, 99999)}",
            "plant_id": pid, "status": "available", "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Make some items low stock for alerts
    items_data[2]["quantity"] = 30
    items_data[2]["min_stock"] = 100
    items_data[7]["quantity"] = 5
    items_data[7]["min_stock"] = 50
    await db.inventory.insert_many(items_data)
    
    work_orders_data = []
    products = ["Assembly Module X200", "Control Panel CP-500", "Robotic Arm Joint J3", "Conveyor Belt Section", "Automated Feeder AF-100"]
    statuses = ["pending", "in_progress", "completed", "on_hold"]
    for i in range(20):
        pid = plants_data[i % len(plants_data)]["plant_id"]
        status = statuses[i % 4]
        qty = random.randint(50, 500)
        completed = qty if status == "completed" else (random.randint(0, qty) if status == "in_progress" else 0)
        defects = random.randint(0, max(1, completed // 20))
        start = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))
        work_orders_data.append({
            "order_id": f"WO-{i+1:04d}", "product_name": products[i % len(products)],
            "quantity": qty, "status": status, "priority": ["low", "medium", "high", "critical"][i % 4],
            "plant_id": pid, "line_id": f"LINE-{(i % 3) + 1}",
            "start_date": start.isoformat(), "end_date": (start + timedelta(days=random.randint(3, 14))).isoformat() if status == "completed" else None,
            "completed_qty": completed, "defect_qty": defects,
            "materials_consumed": [{"item_id": items_data[i % len(items_data)]["item_id"], "quantity": random.randint(10, 100)}],
            "created_at": start.isoformat()
        })
    await db.work_orders.insert_many(work_orders_data)
    
    zones = ["A", "B", "C", "D"]
    wh_locations = []
    for z in zones:
        for a in range(1, 4):
            for r in range(1, 5):
                loc_id = f"LOC-{z}{a}{r:02d}"
                cap = random.randint(50, 200)
                load = random.randint(0, cap)
                wh_locations.append({
                    "location_id": loc_id, "zone": z, "aisle": str(a), "rack": str(r), "shelf": "1",
                    "plant_id": "PLT-WHSE-TX04", "capacity": cap, "current_load": load,
                    "item_ids": [], "status": "available" if load < cap else "full"
                })
    await db.warehouse_locations.insert_many(wh_locations)
    
    picking_data = []
    for i in range(8):
        picking_data.append({
            "pick_id": f"PK-{i+1:04d}", "items": [{"item_id": items_data[i % len(items_data)]["item_id"], "name": items_data[i % len(items_data)]["name"], "quantity": random.randint(5, 50)}],
            "status": ["pending", "in_progress", "completed"][i % 3], "plant_id": "PLT-WHSE-TX04",
            "assigned_to": f"Operator {i+1}", "priority": ["normal", "high", "urgent"][i % 3],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.picking_orders.insert_many(picking_data)
    
    suppliers_data = [
        {"supplier_id": "SUP-ARCSTL", "name": "ArcelorMittal Steel", "contact_email": "supply@arcelor.com", "location": "Luxembourg", "rating": 4.5, "lead_time_days": 14, "status": "active", "items_supplied": ["STL-A36", "SS-304"]},
        {"supplier_id": "SUP-ALCOA", "name": "Alcoa Aluminum", "contact_email": "orders@alcoa.com", "location": "Pittsburgh, PA", "rating": 4.2, "lead_time_days": 10, "status": "active", "items_supplied": ["ALU-6061"]},
        {"supplier_id": "SUP-SMSNG", "name": "Samsung Electronics", "contact_email": "b2b@samsung.com", "location": "Seoul, South Korea", "rating": 4.8, "lead_time_days": 21, "status": "active", "items_supplied": ["SIL-8IN"]},
        {"supplier_id": "SUP-SIEMN", "name": "Siemens Industrial", "contact_email": "parts@siemens.com", "location": "Munich, Germany", "rating": 4.7, "lead_time_days": 12, "status": "active", "items_supplied": ["PLC-S71", "SRV-5KW"]},
        {"supplier_id": "SUP-BOSCG", "name": "Bosch Manufacturing", "contact_email": "supply@bosch.com", "location": "Stuttgart, Germany", "rating": 4.3, "lead_time_days": 8, "status": "active", "items_supplied": ["SNS-P10", "HYD-P200"]},
    ]
    await db.suppliers.insert_many(suppliers_data)
    
    shipments_data = [
        {"shipment_id": "SHP-001", "supplier_id": "SUP-ARCSTL", "origin": "Luxembourg", "destination": "Detroit, MI", "status": "in_transit", "items": [{"sku": "STL-A36", "quantity": 2000}], "eta": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"shipment_id": "SHP-002", "supplier_id": "SUP-SMSNG", "origin": "Seoul, South Korea", "destination": "Shanghai, China", "status": "in_transit", "items": [{"sku": "SIL-8IN", "quantity": 500}], "eta": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"shipment_id": "SHP-003", "supplier_id": "SUP-SIEMN", "origin": "Munich, Germany", "destination": "Munich, Germany", "status": "delivered", "items": [{"sku": "PLC-S71", "quantity": 50}], "eta": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
        {"shipment_id": "SHP-004", "supplier_id": "SUP-BOSCG", "origin": "Stuttgart, Germany", "destination": "Dallas, TX", "status": "in_transit", "items": [{"sku": "SNS-P10", "quantity": 200}], "eta": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(), "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.shipments.insert_many(shipments_data)
    
    devices_data = [
        {"device_id": "DEV-ROB01", "name": "FANUC R-2000iC", "type": "robot", "plant_id": "PLT-DETROIT01", "status": "online", "uptime_hours": 4320, "error_count": 2, "throughput": 150},
        {"device_id": "DEV-ROB02", "name": "KUKA KR 1000", "type": "robot", "plant_id": "PLT-DETROIT01", "status": "online", "uptime_hours": 3890, "error_count": 5, "throughput": 120},
        {"device_id": "DEV-CNV01", "name": "Conveyor Line Alpha", "type": "conveyor", "plant_id": "PLT-DETROIT01", "status": "online", "uptime_hours": 5200, "error_count": 1, "throughput": 500},
        {"device_id": "DEV-CNV02", "name": "Conveyor Line Beta", "type": "conveyor", "plant_id": "PLT-SHANGHAI02", "status": "maintenance", "uptime_hours": 4100, "error_count": 8, "throughput": 0},
        {"device_id": "DEV-ASRS01", "name": "AS/RS Tower Unit 1", "type": "asrs", "plant_id": "PLT-WHSE-TX04", "status": "online", "uptime_hours": 6200, "error_count": 0, "throughput": 300},
        {"device_id": "DEV-ASRS02", "name": "AS/RS Tower Unit 2", "type": "asrs", "plant_id": "PLT-WHSE-TX04", "status": "online", "uptime_hours": 5800, "error_count": 3, "throughput": 280},
        {"device_id": "DEV-SCN01", "name": "Barcode Scanner Gate A", "type": "scanner", "plant_id": "PLT-WHSE-TX04", "status": "online", "uptime_hours": 7000, "error_count": 0, "throughput": 1200},
        {"device_id": "DEV-SCN02", "name": "RFID Portal B", "type": "scanner", "plant_id": "PLT-SHANGHAI02", "status": "online", "uptime_hours": 3500, "error_count": 1, "throughput": 800},
        {"device_id": "DEV-ROB03", "name": "ABB IRB 6700", "type": "robot", "plant_id": "PLT-MUNICH03", "status": "offline", "uptime_hours": 2100, "error_count": 12, "throughput": 0},
        {"device_id": "DEV-AGV01", "name": "AGV Transport Unit 1", "type": "agv", "plant_id": "PLT-WHSE-TX04", "status": "online", "uptime_hours": 4500, "error_count": 2, "throughput": 200},
    ]
    await db.automation_devices.insert_many(devices_data)
    
    trace_logs = []
    events = ["received", "inspected", "stored", "consumed", "produced", "shipped", "quality_check"]
    for i in range(30):
        trace_logs.append({
            "log_id": f"TRC-{i+1:05d}", "item_id": items_data[i % len(items_data)]["item_id"],
            "event_type": events[i % len(events)],
            "description": f"{events[i % len(events)].replace('_', ' ').title()} - {items_data[i % len(items_data)]['name']}",
            "plant_id": plants_data[i % len(plants_data)]["plant_id"],
            "batch_number": f"B-{random.randint(10000, 99999)}",
            "location_from": f"LOC-A{random.randint(1,3)}{random.randint(1,4):02d}" if i % 2 == 0 else None,
            "location_to": f"LOC-B{random.randint(1,3)}{random.randint(1,4):02d}" if i % 2 == 0 else None,
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 720))).isoformat()
        })
    await db.traceability.insert_many(trace_logs)
    
    return {"message": "Seed data created successfully", "seeded": True}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
