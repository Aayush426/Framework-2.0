import React, { useState } from 'react';
import { Button } from '../components/ui/button'; // adjust path if needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'; // adjust path if needed
import { jsPDF } from 'jspdf';

const PortfolioPDF = ({ portfolioItems }) => {
  const [showPreview, setShowPreview] = useState(false);

  const generatePDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    let yOffset = 40;

    portfolioItems.forEach((item, index) => {
      doc.setFontSize(16);
      doc.text(item.title, 40, yOffset);
      yOffset += 20;

      doc.setFontSize(12);
      doc.text(item.description, 40, yOffset, { maxWidth: 500 });
      yOffset += 60;

      if (item.image_url) {
        doc.addImage(item.image_url, 'JPEG', 40, yOffset, 150, 150);
        yOffset += 160;
      }

      if (index < portfolioItems.length - 1) {
        doc.addPage();
        yOffset = 40;
      }
    });

    doc.save('portfolio.pdf');
  };

  return (
    <div className="flex gap-2 mt-4">
      <Button
        type="button"
        onClick={() => setShowPreview(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        Preview Portfolio
      </Button>

      <Button
        type="button"
        onClick={generatePDF}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        Download PDF
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Portfolio Preview</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {portfolioItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 border">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-40 object-cover rounded-md mb-2"
                />
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-3">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowPreview(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioPDF;
