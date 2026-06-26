/**
 * Định dạng giá tiền Việt Nam
 * VD: 100000 → "100.000₫"
 */
export const formatPrice = (val) => {
  if (!val && val !== 0) return null;
  return Number(val).toLocaleString("vi-VN") + "₫";
};
