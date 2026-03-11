import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, XCircle, Search } from "lucide-react";
import { useState, useEffect } from "react";

export default function CertificateVerify() {
  const params = new URLSearchParams(window.location.search);
  const initialNo = params.get("no") || "";
  const [certNo, setCertNo] = useState(initialNo);
  const [searchNo, setSearchNo] = useState(initialNo);

  const { data, isLoading, refetch } = trpc.certificate.verify.useQuery(
    { certificateNo: searchNo },
    { enabled: searchNo.length > 0 }
  );

  useEffect(() => {
    if (initialNo) setSearchNo(initialNo);
  }, [initialNo]);

  const handleSearch = () => {
    if (certNo.trim()) setSearchNo(certNo.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-16">
        <div className="text-center mb-8">
          <Award className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">證書驗證</h1>
          <p className="text-muted-foreground mt-2">輸入證書編號以驗證其真實性</p>
        </div>

        <div className="flex gap-2 mb-8">
          <Input
            placeholder="請輸入證書編號，例如 KDL-XXXXX-XXXX"
            value={certNo}
            onChange={(e) => setCertNo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="text-center"
          />
          <Button onClick={handleSearch} disabled={!certNo.trim()}>
            <Search className="h-4 w-4 mr-1" />
            驗證
          </Button>
        </div>

        {isLoading && searchNo && (
          <Card className="animate-pulse">
            <CardContent className="p-8 h-40" />
          </Card>
        )}

        {data && searchNo && (
          data.valid && data.certificate ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <CardTitle className="text-green-600">證書有效</CardTitle>
                    <p className="text-sm text-muted-foreground">此證書經驗證為真實有效</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">持有人</p>
                    <p className="font-semibold text-lg">{data.certificate.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">證書編號</p>
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                      {data.certificate.certificateNo}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">課程名稱</p>
                    <p className="font-medium">{data.certificate.courseName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">講師</p>
                    <p className="font-medium">{data.certificate.instructorName || "平台講師"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">完課日期</p>
                    <p className="font-medium">{new Date(data.certificate.completedAt).toLocaleDateString("zh-TW")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">頒發日期</p>
                    <p className="font-medium">{new Date(data.certificate.issuedAt).toLocaleDateString("zh-TW")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex flex-col items-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mb-3" />
                <h3 className="text-lg font-semibold text-red-600">查無此證書</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  請確認證書編號是否正確，或聯繫客服協助查詢
                </p>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
