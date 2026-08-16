/**
 * Định dạng giá tiền Việt Nam
 * VD: 100000 → "100.000₫"
 */
export const formatPrice = (val) => {
  if (!val && val !== 0) return null;
  return Number(val).toLocaleString("vi-VN") + "₫";
};

export const formatVND = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Math.floor(Number(value));
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("vi-VN");
};
