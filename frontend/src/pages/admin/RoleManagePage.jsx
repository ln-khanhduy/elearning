import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getRolesApi, createRoleApi, updateRoleApi, deleteRoleApi,
  getAllPermissionsApi, getRolePermissionsApi, updateRolePermissionsApi,
} from "../../api/adminAPI";
import "../../style/admin/role-management.css";

// Trang quản lý vai trò và quyền: tạo, sửa, xóa vai trò và phân quyền
function RoleManagePage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");

  // Permission tab
  const [allPermissions, setAllPermissions] = useState([]);
  const [permGroups, setPermGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState("");

  // Assign tab
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRolesApi();
      const data = result.data || result;
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Không thể tải danh sách role.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllPermissions = useCallback(async () => {
    try {
      const result = await getAllPermissionsApi();
      const data = result.data || result;
      const perms = Array.isArray(data) ? data : [];
      setAllPermissions(perms);
      const groups = [...new Set(perms.map((p) => p.group))].sort();
      setPermGroups(groups);
    } catch (err) {
      toast.error("Không thể tải danh sách permission.");
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchAllPermissions();
  }, [fetchRoles, fetchAllPermissions]);

  const openCreateModal = () => {
    setEditRole(null);
    setFormCode("");
    setFormName("");
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditRole(role);
    setFormCode(role.code);
    setFormName(role.name);
    setShowModal(true);
  };

  const handleSubmitRole = async () => {
    if (!formCode.trim() || !formName.trim()) {
      toast.error("Vui lòng nhập mã role và tên role.");
      return;
    }
    try {
      if (editRole) {
        await updateRoleApi(editRole.id, { code: formCode, name: formName });
        toast.success("Cập nhật role thành công.");
      } else {
        await createRoleApi({ code: formCode, name: formName });
        toast.success("Tạo role thành công.");
      }
      setShowModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Xóa role "${role.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteRoleApi(role.id);
      toast.success("Xóa role thành công.");
      fetchRoles();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const handleSelectRole = async (roleId) => {
    setSelectedRoleId(roleId);
    const role = roles.find((r) => r.id === roleId);
    setSelectedRoleName(role ? role.name : "");
    setAssignLoading(true);
    try {
      const result = await getRolePermissionsApi(roleId);
      const data = result.data || result;
      setRolePerms(Array.isArray(data) ? data.map((p) => p.code) : []);
    } catch (err) {
      toast.error("Không thể tải permissions.");
      setRolePerms([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const togglePermission = (code) => {
    setRolePerms((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleGroupPermissions = (group, checked) => {
    const groupCodes = allPermissions.filter((p) => p.group === group).map((p) => p.code);
    if (checked) {
      setRolePerms((prev) => [...new Set([...prev, ...groupCodes])]);
    } else {
      setRolePerms((prev) => prev.filter((c) => !groupCodes.includes(c)));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      toast.error("Vui lòng chọn role.");
      return;
    }
    try {
      await updateRolePermissionsApi(selectedRoleId, rolePerms);
      toast.success("Cập nhật permissions thành công.");
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra.");
    }
  };

  const filteredPerms = allPermissions.filter((p) => !activeGroup || p.group === activeGroup);

  // Group permissions by group for the assign tab (show ALL permissions)
  const groupedAllPerms = {};
  allPermissions.forEach((p) => {
    if (!groupedAllPerms[p.group]) groupedAllPerms[p.group] = [];
    groupedAllPerms[p.group].push(p);
  });

  return (
    <div className="admin-role-page">
      <div className="inst-page-header role-page-header">
        <h2>Quản lý Role & Permission</h2>
        <p>Quản lý vai trò và phân quyền trong hệ thống.</p>
      </div>

      {/* Tabs */}
      <div className="inst-filter-group role-tabs">
        <button className={`inst-filter-btn ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>
          <i className="bi bi-shield-lock me-1"></i> Quản lý Role
        </button>
        <button className={`inst-filter-btn ${activeTab === "permissions" ? "active" : ""}`} onClick={() => setActiveTab("permissions")}>
          <i className="bi bi-key me-1"></i> Danh sách Permission
        </button>
        <button className={`inst-filter-btn ${activeTab === "assign" ? "active" : ""}`} onClick={() => setActiveTab("assign")}>
          <i className="bi bi-diagram-3 me-1"></i> Gán quyền cho Role
        </button>
      </div>

      {/* Tab: Quản lý Role */}
      {activeTab === "roles" && (
        <div>
          <div className="role-actions-bar">
            <button className="btn-save" onClick={openCreateModal}>
              <i className="bi bi-plus-lg me-1"></i> Tạo Role mới
            </button>
          </div>
          {loading ? (
            <div className="inst-loading"><div className="spinner-border text-primary" role="status"></div></div>
          ) : roles.length === 0 ? (
            <div className="inst-empty"><p className="text-muted">Chưa có role nào.</p></div>
          ) : (
            <div className="inst-table-wrapper role-table-wrapper">
              <table className="inst-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Mã Role</th>
                    <th>Tên Role</th>
                    <th>Số người dùng</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>{role.id}</td>
                      <td><code>{role.code}</code></td>
                      <td>{role.name}</td>
                      <td>{role.user_count || 0}</td>
                      <td>
                        <button className="inst-btn-unlock me-2" onClick={() => openEditModal(role)} title="Sửa">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="inst-btn-lock" onClick={() => handleDeleteRole(role)} title="Xóa">
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Danh sách Permission */}
      {activeTab === "permissions" && (
        <div>
          <div className="inst-filter-group role-perm-filter">
            <button className={`inst-filter-btn ${!activeGroup ? "active" : ""}`} onClick={() => setActiveGroup("")}>Tất cả</button>
            {permGroups.map((g) => (
              <button key={g} className={`inst-filter-btn ${activeGroup === g ? "active" : ""}`} onClick={() => setActiveGroup(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <div className="inst-table-wrapper role-table-wrapper">
            <table className="inst-table">
              <thead>
                <tr>
                  <th>Nhóm</th>
                  <th>Mã Permission</th>
                  <th>Tên hiển thị</th>
                </tr>
              </thead>
              <tbody>
                {filteredPerms.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-muted">Không có permission nào.</td></tr>
                ) : (
                  filteredPerms.map((p, idx) => (
                    <tr key={idx}>
                      <td><span className="inst-badge inst-badge-admin">{p.group}</span></td>
                      <td><code>{p.code}</code></td>
                      <td>{p.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Gán quyền cho Role */}
      {activeTab === "assign" && (
        <div className="assign-layout">
          {/* Left: Role List */}
          <div className="assign-role-panel">
            <div className="assign-role-panel-title">
              Chọn Role
            </div>
            <div className="assign-role-list">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className={`role-list-item ${selectedRoleId === role.id ? "active" : ""}`}
                  onClick={() => handleSelectRole(role.id)}
                >
                  {role.code}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Permissions */}
          <div className="assign-perm-panel">
            {!selectedRoleId ? (
              <div className="assign-placeholder">
                <i className="bi bi-arrow-left assign-placeholder-icon"></i>
                <p className="assign-placeholder-text">Chọn một role để xem và gán quyền.</p>
              </div>
            ) : (
              <div>
                <div className="assign-header">
                  <h5 className="assign-title">
                    Quyền của role: <strong>{selectedRoleName}</strong>
                  </h5>
                  <button className="btn-save" onClick={handleSavePermissions} disabled={assignLoading}>
                    {assignLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
                {assignLoading ? (
                  <div className="assign-loading">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : (
                  Object.entries(groupedAllPerms).map(([group, perms]) => {
                    const groupChecked = perms.every((p) => rolePerms.includes(p.code));
                    const groupPartial = perms.some((p) => rolePerms.includes(p.code)) && !groupChecked;
                    return (
                      <div key={group} className="perm-group-card">
                        <div className="perm-group-header">
                          <label className="cat-checkbox perm-group-checkbox">
                            <input
                              type="checkbox"
                              checked={groupChecked}
                              ref={(el) => { if (el) el.indeterminate = groupPartial; }}
                              onChange={(e) => toggleGroupPermissions(group, e.target.checked)}
                            />
                            <span className="perm-group-name">{group}</span>
                          </label>
                        </div>
                        <div className="perm-group-body">
                          {perms.map((p) => (
                            <label key={p.code} className="cat-checkbox perm-item-checkbox">
                              <input
                                type="checkbox"
                                checked={rolePerms.includes(p.code)}
                                onChange={() => togglePermission(p.code)}
                              />
                              <span title={p.code}>{p.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Create/Edit Role */}
      {showModal && (
        <div className="inst-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="inst-modal-content role-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inst-modal-header">
              <h3 className="inst-modal-title">{editRole ? "Sửa Role" : "Tạo Role mới"}</h3>
              <button className="inst-modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="inst-modal-body">
              <div className="inst-modal-field mb-3">
                <label className="inst-modal-label">Mã Role <span className="text-danger">*</span></label>
                <input className="inst-modal-input" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="VD: CONTENT_MANAGER" />
              </div>
              <div className="inst-modal-field mb-3">
                <label className="inst-modal-label">Tên Role <span className="text-danger">*</span></label>
                <input className="inst-modal-input" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="VD: Quản lý nội dung" />
              </div>
            </div>
            <div className="inst-modal-footer">
              <button className="inst-btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="inst-btn-confirm btn-primary" onClick={handleSubmitRole}>
                {editRole ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default RoleManagePage;