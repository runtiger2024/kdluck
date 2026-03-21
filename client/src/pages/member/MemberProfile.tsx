import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Calendar, MapPin, Briefcase, Building2, Pencil, Save, X, Camera, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

export default function MemberProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const lineBindResult = searchParams.get("line_bind");

  useEffect(() => {
    if (lineBindResult === "success") {
      toast.success("LINE 帳號綁定成功！");
      utils.user.getProfile.invalidate();
      utils.auth.me.invalidate();
      // 清除 URL 參數
      window.history.replaceState({}, "", window.location.pathname);
    } else if (lineBindResult === "failed") {
      toast.error("LINE 帳號綁定失敗，請重試");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [lineBindResult]);

  const { data: siteConfig } = trpc.siteConfig.get.useQuery();
  const lineLoginEnabled = siteConfig?.line_login_enabled === "true" && siteConfig?.line_channel_id;

  function getLineBindUrl() {
    const origin = window.location.origin;
    return `/api/line/login?origin=${encodeURIComponent(origin)}&returnPath=${encodeURIComponent("/member")}&mode=bind`;
  }

  const [form, setForm] = useState({
    name: "", email: "", phone: "", birthday: "",
    gender: null as string | null, city: "", address: "",
    bio: "", occupation: "", company: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        birthday: profile.birthday ?? "",
        gender: profile.gender ?? null,
        city: profile.city ?? "",
        address: profile.address ?? "",
        bio: profile.bio ?? "",
        occupation: profile.occupation ?? "",
        company: profile.company ?? "",
      });
    }
  }, [profile]);

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.user.getProfile.invalidate();
      utils.auth.me.invalidate();
      setEditing(false);
      toast.success("個人資料已更新");
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadMutation = trpc.upload.uploadFile.useMutation();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("圖片大小不能超過 5MB"); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          key: `avatars/${Date.now()}-${file.name}`,
          base64Data: base64,
          contentType: file.type,
        });
        await updateMutation.mutateAsync({ avatarUrl: result.url });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("頭像上傳失敗");
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: form.name || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      birthday: form.birthday || undefined,
      gender: (form.gender as any) || undefined,
      city: form.city || undefined,
      address: form.address || undefined,
      bio: form.bio || undefined,
      occupation: form.occupation || undefined,
      company: form.company || undefined,
    });
  };

  if (!user) return null;

  const genderLabels: Record<string, string> = {
    male: "男", female: "女", other: "其他", prefer_not_to_say: "不願透露",
  };

  const loginMethodLabels: Record<string, string> = {
    line: "LINE 登入", manus: "Manus OAuth", google: "Google 登入",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">個人資料</h1>
        {!editing ? (
          <Button variant="outline" onClick={() => setEditing(true)} className="self-start sm:self-auto">
            <Pencil className="h-4 w-4 mr-2" />編輯資料
          </Button>
        ) : (
          <div className="flex gap-2 self-start sm:self-auto">
            <Button variant="outline" onClick={() => { setEditing(false); if (profile) setForm({ name: profile.name ?? "", email: profile.email ?? "", phone: profile.phone ?? "", birthday: profile.birthday ?? "", gender: profile.gender ?? null, city: profile.city ?? "", address: profile.address ?? "", bio: profile.bio ?? "", occupation: profile.occupation ?? "", company: profile.company ?? "" }); }}>
              <X className="h-4 w-4 mr-2" />取消
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{updateMutation.isPending ? "儲存中..." : "儲存"}
            </Button>
          </div>
        )}
      </div>

      {/* Avatar & Basic Info Card */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><span className="text-xs text-white">上傳中...</span></div>}
            </div>

            {/* Basic info */}
            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-bold">{profile?.name ?? "用戶"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email ?? ""}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={profile?.role === "admin" ? "default" : "secondary"}>
                  {profile?.role === "admin" ? "管理員" : "學員"}
                </Badge>
                <Badge variant="outline">
                  {loginMethodLabels[profile?.loginMethod ?? ""] ?? profile?.loginMethod ?? "Manus OAuth"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                註冊時間：{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("zh-TW") : "-"}
                {" · "}
                最後登入：{profile?.lastSignedIn ? new Date(profile.lastSignedIn).toLocaleDateString("zh-TW") : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />基本資訊</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>姓名</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="您的姓名" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
              </div>
              <div>
                <Label>電話</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0912-345-678" />
              </div>
              <div>
                <Label>生日</Label>
                <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
              </div>
              <div>
                <Label>性別</Label>
                <Select value={form.gender ?? "none"} onValueChange={v => setForm(f => ({ ...f, gender: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇性別" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不選擇</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                    <SelectItem value="prefer_not_to_say">不願透露</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>所在城市</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="台北市" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Label>詳細地址</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="完整地址（選填）" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <InfoRow icon={<User className="h-4 w-4" />} label="姓名" value={profile?.name} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile?.email} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="電話" value={profile?.phone} />
              <InfoRow icon={<Calendar className="h-4 w-4" />} label="生日" value={profile?.birthday} />
              <InfoRow icon={<User className="h-4 w-4" />} label="性別" value={profile?.gender ? genderLabels[profile.gender] : undefined} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="所在城市" value={profile?.city} />
              {profile?.address && <div className="col-span-1 sm:col-span-2"><InfoRow icon={<MapPin className="h-4 w-4" />} label="詳細地址" value={profile.address} /></div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />職業資訊</CardTitle></CardHeader>
        <CardContent>
          {editing ? (            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4
">
              <div>
                <Label>職業</Label>
                <Input value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="軟體工程師" />
              </div>
              <div>
                <Label>公司 / 機構</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="公司名稱" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <InfoRow icon={<Briefcase className="h-4 w-4" />} label="職業" value={profile?.occupation} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="公司 / 機構" value={profile?.company} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Account Binding */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />社群帳號綁定</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* LINE */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                </div>
                <div>
                  <p className="font-medium text-sm">LINE</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.lineUserId ? `已綁定 (ID: ${profile.lineUserId.slice(0, 8)}...)` : "未綁定"}
                  </p>
                </div>
              </div>
              {profile?.lineUserId ? (
                <Badge variant="default" className="bg-[#06C755]">已綁定</Badge>
              ) : lineLoginEnabled ? (
                <Button size="sm" variant="outline" className="bg-[#06C755] hover:bg-[#05b64e] text-white border-[#06C755]" onClick={() => { window.location.href = getLineBindUrl(); }}>
                  綁定 LINE
                </Button>
              ) : (
                <Badge variant="secondary">未開放</Badge>
              )}
            </div>
            {/* Google (placeholder) */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div>
                  <p className="font-medium text-sm">Google</p>
                  <p className="text-xs text-muted-foreground">即將開放</p>
                </div>
              </div>
              <Badge variant="secondary">即將開放</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>自我介紹</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <Textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="簡單介紹一下自己，讓其他學員認識您..."
              rows={4}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile?.bio || "尚未填寫自我介紹"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}
