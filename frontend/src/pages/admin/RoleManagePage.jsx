import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getRolesApi, createRoleApi, updateRoleApi, deleteRoleApi,
  getAllPermissionsApi, getRolePermissionsApi, updateRolePermissionsApi,
} from "../../api/adminAPI";

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
      if (groups.length > 0 && !activeGroup) setActiveGroup(groups[0]);
    } catch (err) {
      toast.error("Không thể tải danh sách permission.");
    }
  }, [activeGroup]);

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
    <div className="admin-role-page" style={{ padding: "24px" }}>
      <div className="inst-page-header" style={{ marginBottom: 20 }}>
        <h2>Quản lý Role & Permission</h2>
        <p>Quản lý vai trò và phân quyền trong hệ thống.</p>
      </div>

      {/* Tabs */}
      <div className="inst-filter-group" style={{ marginBottom: 20 }}>
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
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn-save" onClick={openCreateModal}>
              <i className="bi bi-plus-lg me-1"></i> Tạo Role mới
            </button>
          </div>
          {loading ? (
            <div className="inst-loading"><div className="spinner-border text-primary" role="status"></div></div>
          ) : roles.length === 0 ? (
            <div className="inst-empty"><p className="text-muted">Chưa có role nào.</p></div>
          ) : (
            <div className="inst-table-wrapper">
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
          <div className="inst-filter-group" style={{ marginBottom: 16, flexWrap: "wrap" }}>
            <button className={`inst-filter-btn ${!activeGroup ? "active" : ""}`} onClick={() => setActiveGroup("")}>Tất cả</button>
            {permGroups.map((g) => (
              <button key={g} className={`inst-filter-btn ${activeGroup === g ? "active" : ""}`} onClick={() => setActiveGroup(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
          <div className="inst-table-wrapper">
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
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Left: Role List */}
          <div style={{ width: 220, minWidth: 220, background: "#fff", borderRadius: 10, border: "1px solid #e8ecf1", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #eef0f4", fontWeight: 600, fontSize: "0.88rem", color: "#333" }}>
              Chọn Role
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto", padding: 4 }}>
              {roles.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role.id)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: selectedRoleId === role.id ? "var(--primary, #0f3d75)" : "#555",
                    background: selectedRoleId === role.id ? "#eef3fa" : "transparent",
                    fontWeight: selectedRoleId === role.id ? 600 : 400,
                    borderRadius: 4,
                    margin: 2,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (selectedRoleId !== role.id) e.target.style.background = "#f5f7fb"; }}
                  onMouseLeave={(e) => { if (selectedRoleId !== role.id) e.target.style.background = "transparent"; }}
                >
                  {role.code}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Permissions */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {!selectedRoleId ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
                <i className="bi bi-arrow-left" style={{ fontSize: 36 }}></i>
                <p style={{ marginTop: 12 }}>Chọn một role để xem và gán quyền.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h5 style={{ margin: 0 }}>
                    Quyền của role: <strong>{selectedRoleName}</strong>
                  </h5>
                  <button className="btn-save" onClick={handleSavePermissions} disabled={assignLoading}>
                    {assignLoading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
                {assignLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : (
                  Object.entries(groupedAllPerms).map(([group, perms]) => {
                    const groupChecked = perms.every((p) => rolePerms.includes(p.code));
                    const groupPartial = perms.some((p) => rolePerms.includes(p.code)) && !groupChecked;
                    return (
                      <div key={group} style={{ border: "1px solid #e8ecf1", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ padding: "8px 14px", background: "#f8f9fc", borderBottom: "1px solid #e8ecf1", display: "flex", alignItems: "center" }}>
                          <label className="cat-checkbox" style={{ fontWeight: 600, marginBottom: 0 }}>
                            <input
                              type="checkbox"
                              checked={groupChecked}
                              ref={(el) => { if (el) el.indeterminate = groupPartial; }}
                              onChange={(e) => toggleGroupPermissions(group, e.target.checked)}
                            />
                            <span style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{group}</span>
                          </label>
                        </div>
                        <div style={{ padding: "8px 14px", display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {perms.map((p) => (
                            <label key={p.code} className="cat-checkbox" style={{ fontSize: "0.78rem", marginBottom: 2 }}>
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
          <div className="inst-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
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

      <style>{`
        .cat-checkbox { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px; cursor: pointer; font-size: 0.78rem; color: #555; border-radius: 4px; transition: all 0.15s; user-select: none; margin-bottom: 0; }
        .cat-checkbox:hover { background: #f5f7fb; color: var(--primary, #0f3d75); }
        .cat-checkbox.active { background: #eef3fa; color: var(--primary, #0f3d75); font-weight: 600; }
        .cat-checkbox input[type=checkbox] { appearance: none; -webkit-appearance: none; width: 13px; height: 13px; border: 1.5px solid #d0d5dd; border-radius: 2px; cursor: pointer; flex-shrink: 0; margin: 0; position: relative; }
        .cat-checkbox input[type=checkbox]:checked { border-color: var(--primary, #0f3d75); background-color: var(--primary, #0f3d75); }
        .cat-checkbox input[type=checkbox]:checked::after { content: ""; position: absolute; left: 3px; top: 0; width: 4px; height: 8px; border: solid #fff; border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
        .cat-checkbox input[type=checkbox]:indeterminate { border-color: var(--primary, #0f3d75); background-color: #eef3fa; }
        .cat-checkbox input[type=checkbox]:indeterminate::after { content: ""; position: absolute; left: 2px; top: 5px; width: 7px; height: 1.5px; background: var(--primary, #0f3d75); }
        .btn-save { display: inline-flex; align-items: center; gap: 6px; padding: 9px 22px; background: #0f3d75; color: #fff; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-save:hover { background: #0a2d55; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .inst-modal-input { width: 100%; padding: 8px 12px; border: 1px solid #d0d5dd; border-radius: 6px; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}

export default RoleManagePage;