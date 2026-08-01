/**
 * Định dạng ngày tháng theo chuẩn Việt Nam (vd: 31/07/2026).
 * Trả về "—" nếu giá trị không hợp lệ hoặc rỗng.
 */
export const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
};
