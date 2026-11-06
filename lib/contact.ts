// Coaching office contact shown to guardians. Set these in .env for your coaching.
export const COACHING = {
  name: process.env.NEXT_PUBLIC_COACHING_NAME || "Shikhon Coaching",
  phone: process.env.NEXT_PUBLIC_COACHING_PHONE || "01700000000",
  whatsapp: process.env.NEXT_PUBLIC_COACHING_WHATSAPP || "8801700000000",
  address: process.env.NEXT_PUBLIC_COACHING_ADDRESS || "Mirpur, Dhaka",
};
