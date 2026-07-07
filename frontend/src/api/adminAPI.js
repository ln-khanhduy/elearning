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

export const getRolesApi = async () => {
  return request(() => apiClient.get("/api/admin/roles/"));
};

export const getRoleDetailApi = async (roleId) => {
  return request(() => apiClient.get(`/api/admin/roles/${roleId}/`));
};

export const createRoleApi = async (data) => {
  return request(() => apiClient.post("/api/admin/roles/create/", data));
};

export const updateRoleApi = async (roleId, data) => {
  return request(() => apiClient.patch(`/api/admin/roles/${roleId}/update/`, data));
};

export const deleteRoleApi = async (roleId) => {
  return request(() => apiClient.delete(`/api/admin/roles/${roleId}/delete/`));
};

// ==================== PERMISSIONS ====================

export const getAllPermissionsApi = async () => {
  return request(() => apiClient.get("/api/admin/permissions/"));
};

export const getRolePermissionsApi = async (roleId) => {
  return request(() => apiClient.get(`/api/admin/roles/${roleId}/permissions/`));
};

export const updateRolePermissionsApi = async (roleId, permissionCodes) => {
  return request(() => apiClient.put(`/api/admin/roles/${roleId}/permissions/update/`, {
    permission_codes: permissionCodes,
  }));
};