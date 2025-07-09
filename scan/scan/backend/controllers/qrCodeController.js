const GeneratedQRCode = require('../models/GeneratedQRCode');

// Helper to generate a random 16-digit number as a string
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 16; i++) {
      code += Math.floor(Math.random() * 10);
    }
    const existingCode = await GeneratedQRCode.findOne({ qrCode: code });
    if (!existingCode) {
      isUnique = true;
    }
  }
  return code;
};

// Generate and store new QR codes
exports.generateCodes = async (req, res) => {
  try {
    const { count } = req.body;
    const adminId = req.user.id;

    if (!count || count < 1 || count > 100) {
      return res.status(400).json({ msg: 'Please provide a count between 1 and 100.' });
    }

    const generatedCodes = [];
    for (let i = 0; i < count; i++) {
      const newCode = await generateUniqueCode();
      generatedCodes.push({
        qrCode: newCode,
        generatedBy: adminId,
      });
    }

    const createdQRCodes = await GeneratedQRCode.insertMany(generatedCodes);
    
    res.json({
      msg: `${count} QR codes generated successfully.`,
      codes: createdQRCodes.map(c => c.qrCode),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}; 