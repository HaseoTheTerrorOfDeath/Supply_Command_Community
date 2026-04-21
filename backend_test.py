#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class IndustrialPlatformTester:
    def __init__(self, base_url="https://supply-command-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = "community_test_session_12345"  # Community test session
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    resp_data = response.json()
                    if isinstance(resp_data, list):
                        print(f"   Response: List with {len(resp_data)} items")
                    elif isinstance(resp_data, dict):
                        print(f"   Response keys: {list(resp_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION ENDPOINTS")
        print("="*50)
        
        # Test /auth/me
        self.run_test("Auth Me", "GET", "auth/me", 200)

    def test_seed_data(self):
        """Test seed data creation"""
        print("\n" + "="*50)
        print("TESTING SEED DATA")
        print("="*50)
        
        # Test seed endpoint
        self.run_test("Seed Data", "POST", "seed", 200)

    def test_dashboard_endpoints(self):
        """Test dashboard endpoints"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD ENDPOINTS")
        print("="*50)
        
        # Test dashboard stats
        self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_plants_endpoints(self):
        """Test plants management endpoints"""
        print("\n" + "="*50)
        print("TESTING PLANTS ENDPOINTS")
        print("="*50)
        
        # Test get plants
        success, plants = self.run_test("Get Plants", "GET", "plants", 200)
        
        # Test create plant
        plant_data = {
            "name": "Test Manufacturing Plant",
            "location": "Test City, Test State",
            "type": "factory",
            "capacity": 2000
        }
        success, new_plant = self.run_test("Create Plant", "POST", "plants", 200, plant_data)
        
        # Test get specific plant if creation succeeded
        if success and new_plant.get('plant_id'):
            self.run_test("Get Specific Plant", "GET", f"plants/{new_plant['plant_id']}", 200)

    def test_inventory_endpoints(self):
        """Test inventory management endpoints"""
        print("\n" + "="*50)
        print("TESTING INVENTORY ENDPOINTS")
        print("="*50)
        
        # Test get inventory
        self.run_test("Get Inventory", "GET", "inventory", 200)
        
        # Test get inventory with filters
        self.run_test("Get Inventory by Category", "GET", "inventory", 200, params={"category": "raw_material"})
        
        # Test inventory stats
        self.run_test("Inventory Stats", "GET", "inventory/stats", 200)
        
        # Test create inventory item
        item_data = {
            "name": "Test Component",
            "sku": "TEST-001",
            "category": "component",
            "quantity": 100,
            "unit": "pcs",
            "min_stock": 10,
            "max_stock": 500,
            "plant_id": "PLT-DETROIT01"
        }
        success, new_item = self.run_test("Create Inventory Item", "POST", "inventory", 200, item_data)
        
        # Test update inventory item if creation succeeded
        if success and new_item.get('item_id'):
            update_data = {"quantity": 150}
            self.run_test("Update Inventory Item", "PUT", f"inventory/{new_item['item_id']}", 200, update_data)

    def test_work_orders_endpoints(self):
        """Test work orders/production endpoints"""
        print("\n" + "="*50)
        print("TESTING WORK ORDERS ENDPOINTS")
        print("="*50)
        
        # Test get work orders
        self.run_test("Get Work Orders", "GET", "work-orders", 200)
        
        # Test get work orders with filters
        self.run_test("Get Work Orders by Status", "GET", "work-orders", 200, params={"status": "pending"})
        
        # Test production stats
        self.run_test("Production Stats", "GET", "production/stats", 200)
        
        # Test create work order
        wo_data = {
            "product_name": "Test Product Assembly",
            "quantity": 50,
            "priority": "medium",
            "plant_id": "PLT-DETROIT01"
        }
        success, new_wo = self.run_test("Create Work Order", "POST", "work-orders", 200, wo_data)
        
        # Test update work order status if creation succeeded
        if success and new_wo.get('order_id'):
            update_data = {"status": "in_progress", "completed_qty": 10}
            self.run_test("Update Work Order", "PUT", f"work-orders/{new_wo['order_id']}", 200, update_data)

    def test_warehouse_endpoints(self):
        """Test warehouse/WMS endpoints"""
        print("\n" + "="*50)
        print("TESTING WAREHOUSE ENDPOINTS")
        print("="*50)
        
        # Test get warehouse locations
        self.run_test("Get Warehouse Locations", "GET", "warehouse/locations", 200)
        
        # Test get picking orders
        self.run_test("Get Picking Orders", "GET", "warehouse/picking-orders", 200)
        
        # Test warehouse stats
        self.run_test("Warehouse Stats", "GET", "warehouse/stats", 200)
        
        # Test create warehouse location
        loc_data = {
            "zone": "Z",
            "aisle": "1",
            "rack": "1",
            "shelf": "1",
            "plant_id": "PLT-WHSE-TX04",
            "capacity": 100
        }
        self.run_test("Create Warehouse Location", "POST", "warehouse/locations", 200, loc_data)
        
        # Test create picking order
        pick_data = {
            "items": [{"item_id": "ITM-RM001", "name": "Test Item", "quantity": 5}],
            "plant_id": "PLT-WHSE-TX04",
            "priority": "normal"
        }
        self.run_test("Create Picking Order", "POST", "warehouse/picking-orders", 200, pick_data)

    def test_supply_chain_endpoints(self):
        """Test supply chain endpoints"""
        print("\n" + "="*50)
        print("TESTING SUPPLY CHAIN ENDPOINTS")
        print("="*50)
        
        # Test get suppliers
        self.run_test("Get Suppliers", "GET", "suppliers", 200)
        
        # Test get shipments
        self.run_test("Get Shipments", "GET", "shipments", 200)
        
        # Test supply chain stats
        self.run_test("Supply Chain Stats", "GET", "supply-chain/stats", 200)
        
        # Test create supplier
        supplier_data = {
            "name": "Test Supplier Co",
            "contact_email": "test@supplier.com",
            "location": "Test Location",
            "rating": 4.5,
            "lead_time_days": 10
        }
        self.run_test("Create Supplier", "POST", "suppliers", 200, supplier_data)
        
        # Test create shipment
        shipment_data = {
            "origin": "Test Origin",
            "destination": "Test Destination",
            "status": "in_transit",
            "items": [{"sku": "TEST-001", "quantity": 100}]
        }
        self.run_test("Create Shipment", "POST", "shipments", 200, shipment_data)

    def test_traceability_endpoints(self):
        """Test traceability endpoints"""
        print("\n" + "="*50)
        print("TESTING TRACEABILITY ENDPOINTS")
        print("="*50)
        
        # Test get traceability logs
        self.run_test("Get Traceability Logs", "GET", "traceability", 200)
        
        # Test create trace log
        trace_data = {
            "item_id": "ITM-RM001",
            "event_type": "test_event",
            "description": "Test traceability event",
            "plant_id": "PLT-DETROIT01"
        }
        self.run_test("Create Trace Log", "POST", "traceability", 200, trace_data)

    def test_automation_endpoints(self):
        """Test automation endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTOMATION ENDPOINTS")
        print("="*50)
        
        # Test get automation devices
        self.run_test("Get Automation Devices", "GET", "automation/devices", 200)
        
        # Test automation stats
        self.run_test("Automation Stats", "GET", "automation/stats", 200)

    def test_intelligence_endpoints(self):
        """Test AI intelligence endpoints"""
        print("\n" + "="*50)
        print("TESTING INTELLIGENCE ENDPOINTS")
        print("="*50)
        
        # Test analytics
        self.run_test("Get Analytics", "GET", "intelligence/analytics", 200)
        
        # Test demand forecast (this uses GPT-5.2)
        forecast_data = {
            "product_name": "Test Product",
            "period": "next_quarter"
        }
        print("⚠️  Testing AI Forecast (may take 10-15 seconds)...")
        self.run_test("AI Demand Forecast", "POST", "intelligence/forecast", 200, forecast_data)

def main():
    print("🏭 INDUSTRIAL PLATFORM API TESTING")
    print("="*60)
    
    tester = IndustrialPlatformTester()
    
    # Run all test suites
    tester.test_auth_endpoints()
    tester.test_seed_data()
    tester.test_dashboard_endpoints()
    tester.test_plants_endpoints()
    tester.test_inventory_endpoints()
    tester.test_work_orders_endpoints()
    tester.test_warehouse_endpoints()
    tester.test_supply_chain_endpoints()
    tester.test_traceability_endpoints()
    tester.test_automation_endpoints()
    tester.test_intelligence_endpoints()
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed tests ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"{i}. {failure['test']}")
            if 'expected' in failure:
                print(f"   Expected: {failure['expected']}, Got: {failure['actual']}")
                print(f"   Response: {failure['response']}")
            if 'error' in failure:
                print(f"   Error: {failure['error']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())