import apiClient, { getErrorMessage } from "./apiClient";

const request = async (callback) => {
  try {
    const res = await callback();
    return res.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

// ==================== ROLES ====================

// Lấy danh sách vai trò (roles)
export const getRolesApi = async () => {
  return request(() => apiClient.get("/api/admin/roles/"));
};

// Lấy chi tiết một vai trò theo ID
export const getRoleDetailApi = async (roleId) => {
  return request(() => apiClient.get(`/api/admin/roles/${roleId}/`));
};

// Tạo mới một vai trò
export const createRoleApi = async (data) => {
  return request(() => apiClient.post("/api/admin/roles/create/", data));
};

// Cập nhật thông tin vai trò
export const updateRoleApi = async (roleId, data) => {
  return request(() => apiClient.patch(`/api/admin/roles/${roleId}/update/`, data));
};

// Xóa vai trò
export const deleteRoleApi = async (roleId) => {
  return request(() => apiClient.delete(`/api/admin/roles/${roleId}/delete/`));
};

// ==================== PERMISSIONS ====================

// Lấy danh sách toàn bộ quyền hệ thống
export const getAllPermissionsApi = async () => {
  return request(() => apiClient.get("/api/admin/permissions/"));
};

// Lấy danh sách quyền của một vai trò
export const getRolePermissionsApi = async (roleId) => {
  return request(() => apiClient.get(`/api/admin/roles/${roleId}/permissions/`));
};

// Cập nhật danh sách quyền cho vai trò
export const updateRolePermissionsApi = async (roleId, permissionCodes) => {
  return request(() => apiClient.put(`/api/admin/roles/${roleId}/permissions/update/`, {
    permission_codes: permissionCodes,
  }));
};