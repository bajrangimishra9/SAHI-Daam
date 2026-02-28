import AppLayout from "@/components/app/AppLayout";
import MaterialDialog from "@/components/supplier/MaterialDialog";
import DocumentUploader from "@/components/supplier/DocumentUploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { loadDemoStore, saveDemoStore } from "@/demo/store";
import { BadgeCheck, FileText, MapPinned, Truck } from "lucide-react";
import { useMemo, useState } from "react";

export default function SupplierDashboard() {
  const [discoverable, setDiscoverable] = useState(true);

  const store = loadDemoStore();
  const profile = store.supplier.profile;
  const materials = store.supplier.materials;
  const docs = store.supplier.documents;

  const verificationLabel = useMemo(() => {
    const v = profile.verification;
    if (v === "verified") return "Verified";
    if (v === "rejected") return "Rejected";
    return "Pending";
  }, [profile.verification]);

  return (
    <AppLayout role="supplier" title="Supplier Dashboard">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Supplier profile</h1>
                <p className="mt-2 text-sm text-muted-foreground">Manage geo-location, materials, pricing & logistics.</p>
                <p className="mt-2 text-sm text-muted-foreground">Verification: <span className="font-medium text-foreground">{verificationLabel}</span></p>
              </div>
              <MaterialDialog triggerLabel="Add material" onSaved={() => window.location.reload()} />
            </div>
            <Separator className="my-5" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Business name</Label>
                <Input form="supplier-profile" name="business_name" defaultValue={profile.business_name ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label>City / Pincode</Label>
                <Input form="supplier-profile" name="pincode" defaultValue={profile.pincode ?? ""} placeholder="411001" />
              </div>
              <div className="grid gap-2">
                <Label>Service radius (km)</Label>
                <Input form="supplier-profile" name="service_radius_km" defaultValue={String(profile.service_radius_km ?? 50)} />
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                <div><p className="font-medium">Discoverable</p><p className="text-sm text-muted-foreground">Visible only in relevant geo ranges</p></div>
                <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
              </div>
            </div>

            <form
              id="supplier-profile"
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const business_name = String(fd.get("business_name") ?? "");
                const pincode = String(fd.get("pincode") ?? "");
                const service_radius_km = parseInt(String(fd.get("service_radius_km") ?? "50"), 10) || 50;
                const next = loadDemoStore();
                next.supplier.profile = { ...next.supplier.profile, business_name, pincode, service_radius_km, discoverable };
                saveDemoStore(next);
                toast({ title: "Saved" });
              }}
            >
              <Button type="submit" variant="hero">Save profile</Button>
            </form>
          </Card>

          <Card id="materials" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <h2 className="text-xl font-bold">Materials offered</h2>
            <p className="mt-2 text-sm text-muted-foreground">Civil • Electrical • Machinery</p>
            <div className="mt-5 grid gap-3">
              {(materials ?? []).map((m: any) => (
                <div key={m.id} className="flex flex-col gap-3 rounded-xl border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.category} • ₹ {m.unit_base_price}</p>
                    {m.image_urls?.[0] ? (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={m.image_urls[0]}
                          alt={`${m.name} preview`}
                          loading="lazy"
                          className="h-12 w-12 rounded-lg border object-cover"
                        />
                        <p className="text-xs text-muted-foreground">Image linked</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <MaterialDialog
                      triggerLabel="Edit"
                      initial={m}
                      onSaved={() => window.location.reload()}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = loadDemoStore();
                        next.supplier.materials = next.supplier.materials.filter((x) => x.id !== m.id);
                        saveDemoStore(next);
                        window.location.reload();
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card id="verification" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Verification</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Upload certificates, KYC, and client records.</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border bg-background/60 p-4">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><p className="font-medium">GST / KYC</p></div>
                <div className="mt-3"><DocumentUploader docType="gst_kyc" onUploaded={() => window.location.reload()} /></div>
              </div>
              <div className="rounded-xl border bg-background/60 p-4">
                <div className="flex items-center gap-2"><MapPinned className="h-4 w-4" /><p className="font-medium">Geo proof (non-map)</p></div>
                <div className="mt-3"><DocumentUploader docType="geo_proof" onUploaded={() => window.location.reload()} /></div>
              </div>
              <div className="rounded-xl border bg-background/60 p-4">
                <div className="flex items-center gap-2"><Truck className="h-4 w-4" /><p className="font-medium">Logistics</p></div>
                <div className="mt-3"><DocumentUploader docType="logistics" onUploaded={() => window.location.reload()} /></div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">Uploaded files</p>
              <div className="mt-2 grid gap-2">
                {(docs ?? []).map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
                    <div>
                      <p className="font-medium">{d.doc_type}</p>
                      <p className="text-xs text-muted-foreground">{d.file_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card id="settings" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <h2 className="text-xl font-bold">Settings</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ratings, SLAs, dispute history (demo).</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
