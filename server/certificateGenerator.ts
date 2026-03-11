/**
 * 學習證書 PDF 生成器
 * 使用 PDFKit 生成精美的完課證書，並上傳到 S3
 */
import PDFDocument from "pdfkit";
import { storagePut } from "./storage";

interface CertificateData {
  certificateNo: string;
  userName: string;
  courseName: string;
  instructorName: string;
  completedAt: Date;
  siteName: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<{ url: string; key: string }> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [842, 595], // A4 landscape
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const key = `certificates/${data.certificateNo}.pdf`;
          const { url } = await storagePut(key, pdfBuffer, "application/pdf");
          resolve({ url, key });
        } catch (err) {
          reject(err);
        }
      });

      // ─── 繪製證書 ───

      // 外框
      doc.lineWidth(3)
        .strokeColor("#B8860B")
        .rect(20, 20, 802, 555)
        .stroke();

      // 內框
      doc.lineWidth(1)
        .strokeColor("#DAA520")
        .rect(30, 30, 782, 535)
        .stroke();

      // 裝飾角落
      const corners = [
        { x: 35, y: 35 },
        { x: 792, y: 35 },
        { x: 35, y: 550 },
        { x: 792, y: 550 },
      ];
      corners.forEach(({ x, y }) => {
        doc.circle(x, y, 8).fillColor("#DAA520").fill();
        doc.circle(x, y, 4).fillColor("#FFFFFF").fill();
      });

      // 頂部裝飾線
      doc.moveTo(100, 80).lineTo(742, 80).lineWidth(2).strokeColor("#B8860B").stroke();
      doc.moveTo(100, 84).lineTo(742, 84).lineWidth(0.5).strokeColor("#DAA520").stroke();

      // 標題：完課證書
      doc.fontSize(36)
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text("CERTIFICATE", 0, 100, { align: "center" });

      doc.fontSize(16)
        .fillColor("#555")
        .font("Helvetica")
        .text("OF COMPLETION", 0, 140, { align: "center" });

      // 裝飾線
      doc.moveTo(300, 170).lineTo(542, 170).lineWidth(1).strokeColor("#DAA520").stroke();

      // This is to certify that
      doc.fontSize(12)
        .fillColor("#666")
        .font("Helvetica")
        .text("This is to certify that", 0, 190, { align: "center" });

      // 學員姓名
      doc.fontSize(28)
        .fillColor("#1a1a2e")
        .font("Helvetica-Bold")
        .text(data.userName, 0, 215, { align: "center" });

      // 下劃線
      const nameWidth = doc.widthOfString(data.userName);
      const nameX = (842 - nameWidth) / 2;
      doc.moveTo(nameX - 20, 250).lineTo(nameX + nameWidth + 20, 250).lineWidth(1).strokeColor("#DAA520").stroke();

      // has successfully completed
      doc.fontSize(12)
        .fillColor("#666")
        .font("Helvetica")
        .text("has successfully completed the course", 0, 265, { align: "center" });

      // 課程名稱
      doc.fontSize(20)
        .fillColor("#2d3436")
        .font("Helvetica-Bold")
        .text(data.courseName, 60, 295, { align: "center", width: 722 });

      // 講師
      doc.fontSize(11)
        .fillColor("#888")
        .font("Helvetica")
        .text(`Instructor: ${data.instructorName}`, 0, 340, { align: "center" });

      // 底部裝飾線
      doc.moveTo(100, 380).lineTo(742, 380).lineWidth(1).strokeColor("#DAA520").stroke();

      // 日期和證書編號
      const dateStr = data.completedAt.toLocaleDateString("zh-TW", {
        year: "numeric", month: "long", day: "numeric",
      });

      // 左側：日期
      doc.fontSize(10)
        .fillColor("#666")
        .font("Helvetica")
        .text("Date of Completion", 100, 400);
      doc.fontSize(13)
        .fillColor("#333")
        .font("Helvetica-Bold")
        .text(dateStr, 100, 418);

      // 右側：證書編號
      doc.fontSize(10)
        .fillColor("#666")
        .font("Helvetica")
        .text("Certificate No.", 580, 400);
      doc.fontSize(13)
        .fillColor("#333")
        .font("Helvetica-Bold")
        .text(data.certificateNo, 580, 418);

      // 簽名線
      doc.moveTo(300, 470).lineTo(542, 470).lineWidth(0.5).strokeColor("#999").stroke();
      doc.fontSize(10)
        .fillColor("#888")
        .font("Helvetica")
        .text(data.siteName, 0, 478, { align: "center" });

      // 底部裝飾線
      doc.moveTo(100, 510).lineTo(742, 510).lineWidth(2).strokeColor("#B8860B").stroke();
      doc.moveTo(100, 514).lineTo(742, 514).lineWidth(0.5).strokeColor("#DAA520").stroke();

      // 底部驗證提示
      doc.fontSize(8)
        .fillColor("#aaa")
        .font("Helvetica")
        .text(`Verify this certificate at: ${data.siteName} | Certificate ID: ${data.certificateNo}`, 0, 530, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
