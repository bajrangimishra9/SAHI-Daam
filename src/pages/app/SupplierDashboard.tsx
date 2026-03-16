import AppLayout from "@/components/app/AppLayout";
import DocumentUploader from "@/components/supplier/DocumentUploader";
import LocationPicker from "@/components/location/LocationPicker";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/supabaseClient";

import { BadgeCheck, FileText, MapPinned, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function SupplierDashboard() {
  const [supplierRow, setSupplierRow] = useState<any>(null);
  const [discoverable, setDiscoverable] = useState(true);
  const [openMap, setOpenMap] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    service_radius_km: 50,
    phone: "",
    website: "",
    contact_name: "",
    past_clients: 0,
    rating: 0,
    city: "",
    state: "",
    country: "",
    pincode: "",
  });

  // ✅ Load supplier data on mount
  useEffect(() => {
    const loadSupplier = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
          return;
        }

        const user = authData?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from("suppliers")
          .select("*")
          .eq("user_id", user.id)
          .single(); // ✅ use single() instead of maybeSingle()

        if (error) {
          console.error("Supplier fetch error:", error);
          return;
        }

        if (data) {
          setSupplierRow(data);
          // ✅ Load supplier materials
          const { data: mats, error: matsErr } = await supabase
            .from("supplier_materials")
            .select("*")
            .eq("supplier_id", data.id)
            .order("created_at", { ascending: false });

          if (!matsErr) {
            setMaterials(mats || []);
          }

          setFormData({
            business_name: data.name ?? "",
            service_radius_km: data.service_radius_km ?? 50,
            phone: data.phone ?? "",
            website: data.website ?? "",
            contact_name: data.contact_name ?? "",
            past_clients: data.past_clients ?? 0,
            rating: data.rating ?? 0,
            city: data.city ?? "",
            state: data.state ?? "",
            country: data.country ?? "",
            pincode: data.pincode ?? "",
          });

          // Discoverable
          setDiscoverable(
            typeof data.discoverable === "boolean"
              ? data.discoverable
              : true
          );

          // Location (only address + lat/lng from DB)
          if (data.latitude && data.longitude) {
            setLocation({
              lat: data.latitude,
              lng: data.longitude,
              address: data.address ?? "",
            });
          } else {
            setLocation(null);
          }
        }
      } catch (err) {
        console.error("Unexpected error loading supplier:", err);
      }
    };

    loadSupplier();
  }, []);

  // ✅ Verified status from DB
  const verificationLabel = useMemo(() => {
    if (!supplierRow) return "Pending";
    if (supplierRow.verified === true) return "Verified";
    return "Pending";
  }, [supplierRow]);

  return (
    <AppLayout role="supplier" title="Supplier Dashboard">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* LEFT SIDE */}
        <div className="space-y-6">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Supplier profile</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage geo-location, materials, pricing & logistics.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verification:{" "}
                  <span className="font-medium text-foreground">
                    {verificationLabel}
                  </span>
                </p>
              </div>
            </div>

            <Separator className="my-5" />

            {/* PROFILE FORM */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const fd = new FormData(e.currentTarget);

                const business_name = String(
                  fd.get("business_name") ?? ""
                ).trim();

                const service_radius_km =
                  parseInt(
                    String(fd.get("service_radius_km") ?? "50"),
                    10
                  ) || 50;

                // 🔹 NEW FIELDS
                const phone = String(fd.get("phone") ?? "").trim();
                const pincode = String(fd.get("pincode") ?? "").trim();
                const website = String(fd.get("website") ?? "").trim();
                const contact_name = String(fd.get("contact_name") ?? "").trim();
                const city = String(fd.get("city") ?? "").trim();
                const state = String(fd.get("state") ?? "").trim();
                const country = String(fd.get("country") ?? "").trim();

                const past_clients =
                  parseInt(String(fd.get("past_clients") ?? "0"), 10) || 0;

                const rating =
                  parseFloat(String(fd.get("rating") ?? "0")) || 0;

                const { data: authData } =
                  await supabase.auth.getUser();

                const user = authData?.user;
                if (!user) {
                  toast({
                    title: "Login required",
                    variant: "destructive",
                  });
                  return;
                }

                const payload = {
                  user_id: user.id,
                  email: user.email,
                  contact_person: user.user_metadata?.full_name ?? null,

                  name: formData.business_name,
                  service_radius_km: formData.service_radius_km,
                  discoverable,

                  phone: formData.phone || null,
                  website: formData.website || null,
                  contact_name: formData.contact_name || null,
                  past_clients: formData.past_clients,
                  rating: formData.rating,

                  address: location?.address ?? null,
                  city: formData.city || null,
                  state: formData.state || null,
                  country: formData.country || null,
                  pincode: formData.pincode || null,

                  latitude: location?.lat ?? null,
                  longitude: location?.lng ?? null,
                };

                const { error } = await supabase
                  .from("suppliers")
                  .upsert(payload, {
                    onConflict: "user_id",
                  });

                if (error) {
                  toast({
                    title: "Save failed",
                    description: error.message,
                    variant: "destructive",
                  });
                  return;
                }

                toast({
                  title: "Profile saved successfully",
                });
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="grid gap-2">
                <Label>Business name</Label>
                <Input
                  name="business_name"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Service Radius (km)</Label>
                <Input
                  type="number"
                  value={formData.service_radius_km}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service_radius_km: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Website (optional)</Label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Past Clients</Label>
                <Input
                  type="number"
                  value={formData.past_clients}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      past_clients: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Rating</Label>
                <Input
                  type="number"
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>City</Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Country</Label>
                <Input
                  name="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>Pincode</Label>
                <Input
                  name="pincode"
                  placeholder="e.g. 140413"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({ ...formData, pincode: e.target.value })
                  }
                />
              </div>

              {/* LOCATION */}
              <div className="grid gap-2 md:col-span-2">
                <Label>Business Location</Label>

                <Dialog open={openMap} onOpenChange={setOpenMap}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                    >
                      Select on Map
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl">
                    <LocationPicker
                      serviceRadius={
                        Number(
                          supplierRow?.service_radius_km ?? 50
                        )
                      }
                      onConfirm={(loc) => {
                        setLocation(loc);
                        setOpenMap(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>

                {location && (
                  <div className="rounded-xl border bg-background/60 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      📍 Selected Location
                    </p>
                    <p>{location.address}</p>
                    <p className="text-xs">
                      {location.lat.toFixed(4)},{" "}
                      {location.lng.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4 md:col-span-2">
                <div>
                  <p className="font-medium">
                    Discoverable
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Visible only in relevant geo ranges
                  </p>
                </div>
                <Switch
                  checked={discoverable}
                  onCheckedChange={setDiscoverable}
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" variant="hero">
                  Save profile
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">
                Verification
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Upload certificates, KYC, and client records.
            </p>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border bg-background/60 p-5 shadow-sm">
                <p className="font-semibold">
                  GST / KYC
                </p>
                <DocumentUploader
                  docType="gst_kyc"
                  onUploaded={() =>
                    window.location.reload()
                  }
                />
              </div>

              <div className="rounded-2xl border bg-background/60 p-5 shadow-sm">
                <p className="font-semibold">
                  Geo proof (non-map)
                </p>
                <DocumentUploader
                  docType="geo_proof"
                  onUploaded={() =>
                    window.location.reload()
                  }
                />
              </div>

              <div className="rounded-2xl border bg-background/60 p-5 shadow-sm">
                <p className="font-semibold">
                  Logistics
                </p>
                <DocumentUploader
                  docType="logistics"
                  onUploaded={() =>
                    window.location.reload()
                  }
                />
              </div>

              <div className="rounded-2xl border bg-background/60 p-5 shadow-sm">
                <p className="font-semibold">
                  Material Certificates
                </p>

                <DocumentUploader
                  docType="material_certificate"
                  allowMultiple
                  allowMaterialName
                  onUploaded={() =>
                    window.location.reload()
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}