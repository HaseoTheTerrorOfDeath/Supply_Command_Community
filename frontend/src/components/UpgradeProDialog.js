import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Lock, Zap, Building2, Brain, BarChart3 } from 'lucide-react';

export default function UpgradeProDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-[#E2E8F0] rounded-none max-w-md" data-testid="upgrade-pro-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-[#0F172A] flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
            <Lock className="w-5 h-5 text-[#0055FF]" />
            UPGRADE TO PRO
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[#64748B] leading-relaxed" style={{ fontFamily: 'IBM Plex Sans' }}>
            This feature is available in the <strong className="text-[#0055FF]">Pro version</strong>. Upgrade to unlock the full power of Supply Command.
          </p>

          <div className="space-y-2">
            <h4 className="text-xs tracking-[0.2em] uppercase text-[#94A3B8] font-semibold" style={{ fontFamily: 'IBM Plex Sans' }}>PRO FEATURES INCLUDE</h4>
            {[
              { icon: Building2, text: 'Unlimited multi-plant management' },
              { icon: Brain, text: 'Advanced AI demand forecasting' },
              { icon: BarChart3, text: 'Custom analytics & reporting' },
              { icon: Zap, text: 'Priority support & integrations' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-2 border border-[#E2E8F0] bg-[#F8FAFC]">
                <Icon className="w-4 h-4 text-[#0055FF] flex-shrink-0" />
                <span className="text-sm text-[#0F172A]" style={{ fontFamily: 'IBM Plex Sans' }}>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              data-testid="upgrade-pro-btn"
              className="flex-1 rounded-none bg-[#0055FF] hover:bg-[#3377FF] text-white font-semibold"
              onClick={() => onOpenChange(false)}
            >
              <Zap className="w-4 h-4 mr-2" />
              UPGRADE NOW
            </Button>
            <Button
              data-testid="dismiss-upgrade-btn"
              variant="outline"
              className="rounded-none border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
              onClick={() => onOpenChange(false)}
            >
              MAYBE LATER
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
