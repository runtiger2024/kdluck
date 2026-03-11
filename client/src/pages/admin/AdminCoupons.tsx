import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminCoupons() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.coupon.all.useQuery({ page, limit: 20 });

  const createMutation = trpc.coupon.create.useMutation({
    onSuccess: () => { utils.coupon.all.invalidate(); setDialogOpen(false); toast.success("優惠券已建立"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.coupon.update.useMutation({
    onSuccess: () => { utils.coupon.all.invalidate(); setDialogOpen(false); toast.success("優惠券已更新"); },
  });
  const deleteMutation = trpc.coupon.delete.useMutation({
    onSuccess: () => { utils.coupon.all.invalidate(); toast.success("優惠券已刪除"); },
  });

  const [form, setForm] = useState({
    code: "", discountType: "fixed" as "fixed" | "percentage", discountValue: "0",
    minOrderAmount: "0", maxUses: 0, expiresAt: "", isActive: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discountType: "fixed", discountValue: "0", minOrderAmount: "0", maxUses: 0, expiresAt: "", isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount ?? "0", maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : "",
      isActive: coupon.isActive,
    });
    setDialogOpen(true);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "KD";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, code }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">優惠券管理</h1>
        <Button size="sm" className="sm:size-default" onClick={openCreate}><Plus className="h-4 w-4 mr-1 sm:mr-2" />新增</Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>優惠碼</TableHead>
                  <TableHead>折扣</TableHead>
                  <TableHead>使用次數</TableHead>
                  <TableHead>最低消費</TableHead>
                  <TableHead>到期日</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">尚無優惠券</TableCell></TableRow>
                ) : (
                  data?.items.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell>{coupon.discountType === "fixed" ? `NT$ ${coupon.discountValue}` : `${coupon.discountValue}%`}</TableCell>
                      <TableCell>{coupon.usedCount} / {coupon.maxUses === 0 ? "無限" : coupon.maxUses}</TableCell>
                      <TableCell>NT$ {coupon.minOrderAmount}</TableCell>
                      <TableCell className="text-xs">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("zh-TW") : "無期限"}</TableCell>
                      <TableCell><Badge variant={coupon.isActive ? "default" : "secondary"}>{coupon.isActive ? "啟用" : "停用"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteMutation.mutate({ id: coupon.id }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">尚無優惠券</div>
            ) : (
              data?.items.map((coupon) => (
                <div key={coupon.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono font-bold text-sm">{coupon.code}</p>
                      <p className="text-sm text-primary">
                        {coupon.discountType === "fixed" ? `折扣 NT$ ${coupon.discountValue}` : `折扣 ${coupon.discountValue}%`}
                      </p>
                    </div>
                    <Badge variant={coupon.isActive ? "default" : "secondary"} className="shrink-0">{coupon.isActive ? "啟用" : "停用"}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>已用 {coupon.usedCount}/{coupon.maxUses === 0 ? "∞" : coupon.maxUses}</span>
                    <span>最低 NT$ {coupon.minOrderAmount}</span>
                    <span>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("zh-TW") : "無期限"}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => openEdit(coupon)}><Pencil className="h-3 w-3 mr-1" />編輯</Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteMutation.mutate({ id: coupon.id }); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>{editing ? "編輯優惠券" : "新增優惠券"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>優惠碼 *</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="KDLUCK2026" />
                <Button variant="outline" size="sm" onClick={generateCode}><Ticket className="h-4 w-4 mr-1" />自動產生</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label>折扣類型</Label>
                <Select value={form.discountType} onValueChange={(v: any) => setForm(f => ({ ...f, discountType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">固定金額</SelectItem>
                    <SelectItem value="percentage">百分比</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>折扣值 {form.discountType === "fixed" ? "(NT$)" : "(%)"}</Label>
                <Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label>最低消費 (NT$)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} />
              </div>
              <div>
                <Label>最大使用次數 (0=無限)</Label>
                <Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>到期日</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label>啟用</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <Button onClick={() => {
                if (!form.code) { toast.error("請填寫優惠碼"); return; }
                if (editing) {
                  updateMutation.mutate({
                    id: editing.id, code: form.code, discountType: form.discountType,
                    discountValue: form.discountValue, minOrderAmount: form.minOrderAmount,
                    maxUses: form.maxUses,
                    expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
                    isActive: form.isActive,
                  });
                } else {
                  createMutation.mutate({
                    code: form.code, discountType: form.discountType,
                    discountValue: form.discountValue, minOrderAmount: form.minOrderAmount,
                    maxUses: form.maxUses,
                    expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
                    isActive: form.isActive,
                  });
                }
              }}>
                {editing ? "更新" : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
