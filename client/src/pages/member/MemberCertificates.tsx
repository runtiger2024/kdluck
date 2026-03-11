import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, ExternalLink, FileText } from "lucide-react";

export default function MemberCertificates() {
  const { data: certs, isLoading } = trpc.certificate.myList.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">我的證書</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-48" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-7 w-7 text-amber-500" />
        <h1 className="text-2xl font-bold">我的證書</h1>
      </div>

      {!certs || certs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">尚無證書</h3>
            <p className="text-sm text-muted-foreground/70 mt-2 max-w-md">
              完成課程學習進度達 80% 以上，即可獲得完課證書。前往「我的課程」繼續學習吧！
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certs.map((cert) => (
            <Card key={cert.id} className="overflow-hidden border-amber-500/20 hover:border-amber-500/40 transition-colors">
              <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-base">完課證書</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs">
                    {cert.certificateNo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{cert.courseName}</h3>
                  {cert.instructorName && (
                    <p className="text-sm text-muted-foreground mt-1">講師：{cert.instructorName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>頒發日期：{new Date(cert.issuedAt).toLocaleDateString("zh-TW")}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  {cert.pdfUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        下載 PDF
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/certificate/verify?no=${cert.certificateNo}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      驗證連結
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
