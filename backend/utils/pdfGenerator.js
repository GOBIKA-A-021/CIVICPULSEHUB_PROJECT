// PDF utility for generating complaint PDFs
// Note: This requires 'pdfkit' package. Install with: npm install pdfkit

export const generateComplaintPDF = (doc, complaint) => {
  // Title
  doc.fontSize(20).font('Helvetica-Bold').text('Complaint Report', { align: 'center' });
  doc.moveDown(0.5);
  
  // Divider
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // Complaint ID and Status
  doc.fontSize(12).font('Helvetica-Bold').text('Complaint ID: ' + complaint.id);
  doc.fontSize(11).font('Helvetica').text('Status: ' + complaint.status);
  doc.text('Priority: ' + complaint.priority);
  doc.moveDown(0.5);

  // Title and Category
  doc.fontSize(13).font('Helvetica-Bold').text('Title');
  doc.fontSize(11).font('Helvetica').text(complaint.title, { align: 'left' });
  doc.moveDown(0.3);

  // Category and Location
  doc.fontSize(12).font('Helvetica-Bold').text('Category: ');
  doc.fontSize(11).font('Helvetica').text(complaint.category);
  
  doc.fontSize(12).font('Helvetica-Bold').text('Location: ');
  doc.fontSize(11).font('Helvetica').text(complaint.location);
  doc.moveDown(0.5);

  // Description
  doc.fontSize(12).font('Helvetica-Bold').text('Description');
  doc.fontSize(10).font('Helvetica').text(complaint.description, {
    align: 'left',
    width: 500,
    wrap: true
  });
  doc.moveDown(0.5);

  // Assignment Info
  if (complaint.assignedOfficer) {
    doc.fontSize(12).font('Helvetica-Bold').text('Assigned Officer');
    doc.fontSize(11).font('Helvetica').text(complaint.assignedOfficer);
    if (complaint.officerLevel) doc.text('Level: ' + complaint.officerLevel);
    doc.moveDown(0.5);
  }

  // Resolution Remarks (if available)
  if (complaint.resolutionRemarks) {
    doc.fontSize(12).font('Helvetica-Bold').text('Resolution Remarks');
    doc.fontSize(10).font('Helvetica').text(complaint.resolutionRemarks, {
      align: 'left',
      width: 500,
      wrap: true
    });
    doc.moveDown(0.5);
  }

  // Dates
  doc.fontSize(10).font('Helvetica');
  doc.text('Created: ' + new Date(complaint.createdAt).toLocaleString());
  if (complaint.updatedAt) {
    doc.text('Updated: ' + new Date(complaint.updatedAt).toLocaleString());
  }

  // Footer
  doc.moveDown(1);
  doc.fontSize(8).font('Helvetica').text('This is an official complaint report from CivicPulseHub', { align: 'center' });
  doc.text('Generated on ' + new Date().toLocaleString(), { align: 'center' });
};

export const generateMonthlyReportPDF = (doc, complaints, month, year) => {
  // Title
  doc.fontSize(24).font('Helvetica-Bold').text('Monthly Complaints Report', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text(`${month} ${year}`, { align: 'center' });
  doc.moveDown(0.5);

  // Divider
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // Summary Statistics
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'PENDING').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const closedCount = complaints.filter(c => c.status === 'CLOSED').length;

  doc.fontSize(12).font('Helvetica-Bold').text('Summary Statistics');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Total Complaints: ${totalComplaints}`);
  doc.text(`Pending: ${pendingCount}`);
  doc.text(`In Progress: ${inProgressCount}`);
  doc.text(`Resolved: ${resolvedCount}`);
  doc.text(`Closed: ${closedCount}`);
  doc.moveDown(0.5);

  // Category Breakdown
  const categories = {};
  complaints.forEach(c => {
    categories[c.category] = (categories[c.category] || 0) + 1;
  });

  doc.fontSize(12).font('Helvetica-Bold').text('Complaints by Category');
  Object.entries(categories).forEach(([cat, count]) => {
    doc.fontSize(10).font('Helvetica').text(`${cat}: ${count}`);
  });

  // Divider
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);

  // Detailed Complaints List
  doc.fontSize(12).font('Helvetica-Bold').text('Detailed Complaints List');
  
  complaints.slice(0, 20).forEach((complaint, idx) => {
    if (doc.y > 700) doc.addPage();
    doc.fontSize(10).font('Helvetica-Bold').text(`${idx + 1}. ${complaint.title}`, { underline: true });
    doc.fontSize(9).font('Helvetica');
    doc.text(`ID: ${complaint.id} | Category: ${complaint.category} | Status: ${complaint.status}`);
    doc.text(`Priority: ${complaint.priority} | Location: ${complaint.location}`);
    doc.moveDown(0.2);
  });

  // Footer
  doc.moveDown(1);
  doc.fontSize(8).font('Helvetica').text('End of Report', { align: 'center' });
  doc.text('Generated on ' + new Date().toLocaleString(), { align: 'center' });
};
