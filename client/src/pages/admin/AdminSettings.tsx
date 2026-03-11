import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Settings, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { data: config, isLoading } = trpc.siteConfig.get.useQuery();
  const { data: templates } = trpc.notification.templates.useQuery();
  const { data: categoriesList } = trpc.category.list.useQuery();
  const { data: instructorsList } = trpc.instructor.list.useQuery();

  const utils = trpc.useUtils();
  const updateBatch = trpc.siteConfig.updateBatch.useMutation({
    onSuccess: () => { utils.siteConfig.get.invalidate(); toast.success("設定已儲存"); },
  });
  const updateTemplate = trpc.notification.updateTemplate.useMutation({
    onSuccess: () => { utils.notification.templates.invalidate(); toast.success("模板已更新"); },
  });

  // Category CRUD
  const createCategory = trpc.category.create.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("分類已建立"); setCatForm({ name: "", slug: "", description: "" }); },
  });
  const deleteCategory = trpc.category.delete.useMutation({
    onSuccess: () => { utils.category.list.invalidate(); toast.success("分類已刪除"); },
  });

  // Instructor CRUD
  const createInstructor = trpc.instructor.create.useMutation({
    onSuccess: () => { utils.instructor.list.invalidate(); toast.success("講師已建立"); setInstForm({ name: "", title: "", bio: "" }); },
  });
  const deleteInstructor = trpc.instructor.delete.useMutation({
    onSuccess: () => { utils.instructor.list.invalidate(); toast.success("講師已刪除"); },
  });

  const [siteForm, setSiteForm] = useState({
    site_name: "", site_logo: "", site_description: "",
    contact_email: "", contact_phone: "", seo_keywords: "", footer_text: "",
  });

  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "" });
  const [instForm, setInstForm] = useState({ name: "", title: "", bio: "" });

  useEffect(() => {
    if (config) {
      setSiteForm({
        site_name: config.site_name ?? "",
        site_logo: config.site_logo ?? "",
        site_description: config.site_description ?? "",
        contact_email: config.contact_email ?? "",
        contact_phone: config.contact_phone ?? "",
        seo_keywords: config.seo_keywords ?? "",
        footer_text: config.footer_text ?? "",
      });
    }
  }, [config]);

  const saveSiteConfig = () => {
    const items = Object.entries(siteForm).map(([key, value]) => ({ key, value }));
    updateBatch.mutate(items);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">系統設定</h1>

      <Tabs defaultValue="site">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="site" className="text-xs sm:text-sm"><Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />全站</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">分類</TabsTrigger>
          <TabsTrigger value="instructors" className="text-xs sm:text-sm">講師</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm"><Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />模板</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>基本資訊</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>網站名稱</Label>
                  <Input value={siteForm.site_name} onChange={e => setSiteForm(f => ({ ...f, site_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={siteForm.site_logo} onChange={e => setSiteForm(f => ({ ...f, site_logo: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>網站描述</Label>
                <Textarea value={siteForm.site_description} onChange={e => setSiteForm(f => ({ ...f, site_description: e.target.value }))} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>客服 Email</Label>
                  <Input value={siteForm.contact_email} onChange={e => setSiteForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div>
                  <Label>客服電話</Label>
                  <Input value={siteForm.contact_phone} onChange={e => setSiteForm(f => ({ ...f, contact_phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>SEO 關鍵字 (逗號分隔)</Label>
                <Input value={siteForm.seo_keywords} onChange={e => setSiteForm(f => ({ ...f, seo_keywords: e.target.value }))} />
              </div>
              <div>
                <Label>頁尾文字</Label>
                <Input value={siteForm.footer_text} onChange={e => setSiteForm(f => ({ ...f, footer_text: e.target.value }))} />
              </div>
              <Button onClick={saveSiteConfig} disabled={updateBatch.isPending}><Save className="h-4 w-4 mr-2" />儲存設定</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>新增分類</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Input placeholder="分類名稱" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                <Input placeholder="Slug (英文)" value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: e.target.value }))} />
                <Button onClick={() => { if (catForm.name && catForm.slug) createCategory.mutate(catForm); else toast.error("請填寫名稱與 Slug"); }}>新增</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>現有分類</CardTitle></CardHeader>
            <CardContent>
              {categoriesList?.length === 0 ? (
                <p className="text-muted-foreground">尚無分類</p>
              ) : (
                <div className="space-y-2">
                  {categoriesList?.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">/{cat.slug}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteCategory.mutate({ id: cat.id }); }}>刪除</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>新增講師</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input placeholder="講師姓名" value={instForm.name} onChange={e => setInstForm(f => ({ ...f, name: e.target.value }))} />
                  <Input placeholder="頭銜" value={instForm.title} onChange={e => setInstForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <Textarea placeholder="講師簡介" value={instForm.bio} onChange={e => setInstForm(f => ({ ...f, bio: e.target.value }))} rows={2} />
                <Button onClick={() => { if (instForm.name) createInstructor.mutate(instForm); else toast.error("請填寫講師姓名"); }}>新增</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader><CardTitle>現有講師</CardTitle></CardHeader>
            <CardContent>
              {instructorsList?.length === 0 ? (
                <p className="text-muted-foreground">尚無講師</p>
              ) : (
                <div className="space-y-2">
                  {instructorsList?.map(inst => (
                    <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div>
                        <span className="font-medium">{inst.name}</span>
                        {inst.title && <span className="text-xs text-muted-foreground ml-2">{inst.title}</span>}
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteInstructor.mutate({ id: inst.id }); }}>刪除</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          {templates?.map(tpl => (
            <Card key={tpl.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tpl.templateName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch checked={tpl.isActive} onCheckedChange={v => updateTemplate.mutate({ id: tpl.id, isActive: v })} />
                    <span className="text-xs text-muted-foreground">{tpl.isActive ? "啟用" : "停用"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Label className="text-xs text-muted-foreground mb-2 block">模板 Key: {tpl.templateKey}</Label>
                <Textarea
                  defaultValue={tpl.templateBody}
                  rows={3}
                  onBlur={e => {
                    if (e.target.value !== tpl.templateBody) {
                      updateTemplate.mutate({ id: tpl.id, templateBody: e.target.value });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">可用變數：{"{name}"}, {"{courseName}"}, {"{couponCode}"}, {"{orderNo}"}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
