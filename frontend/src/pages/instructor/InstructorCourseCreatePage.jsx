import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCategoriesApi, createFullCourseApi } from "../../api/courseAPI";

const initQuiz = () => ({ title: "", description: "", time_limit_minutes: null, passing_score: 0, questions: [] });
const initQ = () => ({ question_type: "MCQ", prompt: "", order: 1, points: 1, correct_text_answer: "", options: [] });
const initOpt = () => ({ text: "", is_correct: false, order: 1 });
const initLesson = (o) => ({ title: "", description: "", content_type: "VIDEO", order: o, is_free: false });
const initSection = (o) => ({ title: "", description: "", order: o, lessons: [] });

function InstructorCourseCreatePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", category: "" });
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState("");
  const [sections, setSections] = useState([]);
  const [files, setFiles] = useState({});
  const [quizzes, setQuizzes] = useState({});

  useEffect(() => { getCategoriesApi().then(setCategories).catch(() => {}); }, []);

  const upd = (obj, setter) => (e) => setter({ ...obj, [e.target.name]: e.target.value });
  const onThumbnail = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(f.type)) { toast.error("Chỉ chấp nhận JPG, PNG, WEBP."); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("Kích thước ảnh tối đa 5MB."); return; }
    setThumbnail(f); setPreview(URL.createObjectURL(f));
  };

  // Sections
  const addSection = () => setSections(p => [...p, initSection(p.length + 1)]);
  const updSection = (i, f, v) => setSections(p => { const u = [...p]; u[i] = { ...u[i], [f]: v }; return u; });
  const delSection = (i) => {
    setSections(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })));
    setQuizzes(p => { const n = {}; Object.keys(p).forEach(k => { const [si, li] = k.split("-").map(Number); if (si < i) n[k] = p[k]; if (si > i) n[`${si - 1}-${li}`] = p[k]; }); return n; });
  };

  // Lessons
  const addLesson = (si) => setSections(p => { const u = [...p]; u[si].lessons.push(initLesson(u[si].lessons.length + 1)); return u; });
  const updLesson = (si, li, f, v) => setSections(p => { const u = [...p]; u[si].lessons[li] = { ...u[si].lessons[li], [f]: v }; return u; });
  const delLesson = (si, li) => {
    setSections(p => { const u = [...p]; u[si].lessons = u[si].lessons.filter((_, i) => i !== li).map((l, i) => ({ ...l, order: i + 1 })); return u; });
    setQuizzes(p => { const n = {}; Object.keys(p).forEach(k => { const [s, l] = k.split("-").map(Number); if (s === si && l === li) return; if (s === si && l > li) n[`${s}-${l - 1}`] = p[k]; else n[k] = p[k]; }); return n; });
  };
  const onFile = (si, li, type, file) => setFiles(p => ({ ...p, [`${si}-${li}`]: { ...(p[`${si}-${li}`] || {}), [type]: file } }));

  // Quizzes
  const addQuiz = (si, li) => setQuizzes(p => ({ ...p, [`${si}-${li}`]: [...(p[`${si}-${li}`] || []), initQuiz()] }));
  const updQuiz = (si, li, qi, f, v) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; list[qi] = { ...list[qi], [f]: v }; u[k] = list; return u; });
  const delQuiz = (si, li, qi) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; u[k] = (u[k] || []).filter((_, i) => i !== qi); if (!u[k].length) delete u[k]; return u; });
  const addQ = (si, li, qi) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; list[qi] = { ...list[qi], questions: [...(list[qi].questions || []), { ...initQ(), order: (list[qi].questions?.length || 0) + 1 }] }; u[k] = list; return u; });
  const updQ = (si, li, qi, qIdx, f, v) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; const qs = [...(list[qi].questions || [])]; qs[qIdx] = { ...qs[qIdx], [f]: v }; list[qi] = { ...list[qi], questions: qs }; u[k] = list; return u; });
  const delQ = (si, li, qi, qIdx) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; list[qi] = { ...list[qi], questions: (list[qi].questions || []).filter((_, i) => i !== qIdx) }; u[k] = list; return u; });
  const addOpt = (si, li, qi, qIdx) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; const qs = [...(list[qi].questions || [])]; qs[qIdx] = { ...qs[qIdx], options: [...(qs[qIdx].options || []), { ...initOpt(), order: (qs[qIdx].options?.length || 0) + 1 }] }; list[qi] = { ...list[qi], questions: qs }; u[k] = list; return u; });
  const updOpt = (si, li, qi, qIdx, oIdx, f, v) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; const qs = [...(list[qi].questions || [])]; const opts = [...(qs[qIdx].options || [])]; opts[oIdx] = { ...opts[oIdx], [f]: v }; qs[qIdx] = { ...qs[qIdx], options: opts }; list[qi] = { ...list[qi], questions: qs }; u[k] = list; return u; });
  const delOpt = (si, li, qi, qIdx, oIdx) => setQuizzes(p => { const k = `${si}-${li}`; const u = { ...p }; const list = [...(u[k] || [])]; const qs = [...(list[qi].questions || [])]; qs[qIdx] = { ...qs[qIdx], options: (qs[qIdx].options || []).filter((_, i) => i !== oIdx) }; list[qi] = { ...list[qi], questions: qs }; u[k] = list; return u; });

  const validate = () => {
    const errs = {};
    if (!form.title?.trim() || form.title.trim().length < 5) errs.title = "Tiêu đề phải có ít nhất 5 ký tự.";
    if (!form.description?.trim() || form.description.trim().length < 20) errs.description = "Mô tả phải có ít nhất 20 ký tự.";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errs.price = "Giá phải là số dương.";
    if (!form.category) errs.category = "Vui lòng chọn danh mục.";
    if (sections.length === 0) errs.sections = "Vui lòng thêm ít nhất một chương.";
    sections.forEach((sec, si) => {
      if (!sec.title.trim() || sec.title.trim().length < 3) errs[`sec_${si}`] = `Chương ${si + 1}: Tên chương phải có ít nhất 3 ký tự.`;
      if (sec.lessons.length === 0) errs[`sec_${si}_lessons`] = `Chương "${sec.title}": Vui lòng thêm ít nhất một bài học.`;
      sec.lessons.forEach((les, li) => {
        if (!les.title.trim() || les.title.trim().length < 3) errs[`les_${si}_${li}`] = `Bài ${li + 1} của chương "${sec.title}": Tên bài phải có ít nhất 3 ký tự.`;
      });
    } );
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { toast.error(Object.values(errs)[0]); return; }

    // Build payload
    const payload = {
      title: form.title.trim(), description: form.description.trim(), price: Number(form.price), category: Number(form.category),
      sections: sections.map((sec, si) => ({
        title: sec.title.trim(), description: sec.description.trim(), order: sec.order,
        lessons: sec.lessons.map((les, li) => ({
          title: les.title.trim(), description: les.description.trim(), content_type: les.content_type, order: les.order, is_free: les.is_free,
          quizzes: (quizzes[`${si}-${li}`] || []).map(qz => ({
            title: qz.title, description: qz.description, time_limit_minutes: qz.time_limit_minutes ? Number(qz.time_limit_minutes) : null, passing_score: Number(qz.passing_score),
            questions: (qz.questions || []).map(q => ({
              question_type: q.question_type, prompt: q.prompt, order: q.order, points: Number(q.points), correct_text_answer: q.correct_text_answer || "",
              options: (q.options || []).map(opt => ({ text: opt.text, is_correct: opt.is_correct, order: opt.order })),
            })),
          })),
        })),
      })),
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    if (thumbnail) formData.append("thumbnail", thumbnail);

    setLoading(true);
    try {
      const res = await createFullCourseApi(formData);
      toast.success("Tạo khóa học thành công!");
      navigate("/instructor/courses");
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra.");
    } finally { setLoading(false); }
  };

  const renderQuizSection = (sec, si) => sec.lessons.map((les, li) => {
    const qzList = quizzes[`${si}-${li}`] || [];
    return (
      <div key={li} className="lesson-card mb-3">
        <div className="lesson-card-header">
          <strong><i className="bi bi-play-circle me-2"></i>{les.title || `Bài ${li + 1}`}</strong>
          <button type="button" className="course-btn-sm course-btn-primary" onClick={() => addQuiz(si, li)}><i className="bi bi-plus-lg me-1"></i> Thêm bài tập</button>
        </div>
        {qzList.length === 0 && <p className="text-muted small px-3 py-2 mb-0">Chưa có bài tập nào.</p>}
        {qzList.map((qz, qi) => (
          <div key={qi} className="quiz-card">
            <div className="quiz-card-header">
              <strong>Bài tập {qi + 1}</strong>
              <button type="button" className="course-btn-sm course-btn-danger" onClick={() => delQuiz(si, li, qi)}><i className="bi bi-trash"></i></button>
            </div>
            <div className="quiz-card-body">
              <div className="lesson-fields-row">
                <div className="lesson-field flex-grow-1"><label>Tên bài tập</label>
                  <input type="text" className="course-form-input" value={qz.title} onChange={e => updQuiz(si, li, qi, "title", e.target.value)} placeholder="VD: Bài tập 1" />
                </div>
                <div className="lesson-field"><label>Thời gian (phút)</label>
                  <input type="number" className="course-form-input" value={qz.time_limit_minutes || ""} onChange={e => updQuiz(si, li, qi, "time_limit_minutes", e.target.value)} placeholder="Không giới hạn" min="0" />
                </div>
                <div className="lesson-field"><label>Điểm đạt</label>
                  <input type="number" className="course-form-input" value={qz.passing_score} onChange={e => updQuiz(si, li, qi, "passing_score", e.target.value)} step="0.5" min="0" />
                </div>
              </div>
              <div className="lesson-field"><label>Mô tả</label>
                <textarea className="course-form-textarea" value={qz.description} onChange={e => updQuiz(si, li, qi, "description", e.target.value)} rows={2} placeholder="Hướng dẫn làm bài..." />
              </div>
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong className="small">Câu hỏi</strong>
                  <button type="button" className="course-btn-sm course-btn-outline" onClick={() => addQ(si, li, qi)}><i className="bi bi-plus-lg me-1"></i> Thêm câu hỏi</button>
                </div>
                {(qz.questions || []).map((q, qIdx) => (
                  <div key={qIdx} className="question-card">
                    <div className="question-card-header">
                      <strong className="small">Câu {qIdx + 1}</strong>
                      <button type="button" className="course-btn-sm course-btn-danger" onClick={() => delQ(si, li, qi, qIdx)}><i className="bi bi-x-lg"></i></button>
                    </div>
                    <div className="lesson-fields-row">
                      <div className="lesson-field"><label>Loại</label>
                        <select value={q.question_type} onChange={e => updQ(si, li, qi, qIdx, "question_type", e.target.value)} className="course-form-input">
                          <option value="MCQ">Trắc nghiệm</option><option value="FILL_BLANK">Điền khuyết</option><option value="ESSAY">Tự luận</option>
                        </select>
                      </div>
                      <div className="lesson-field"><label>Điểm</label>
                        <input type="number" className="course-form-input" value={q.points} onChange={e => updQ(si, li, qi, qIdx, "points", e.target.value)} step="0.5" min="0" />
                      </div>
                    </div>
                    <div className="lesson-field"><label>Nội dung</label>
                      <textarea className="course-form-textarea" value={q.prompt} onChange={e => updQ(si, li, qi, qIdx, "prompt", e.target.value)} rows={2} placeholder="Nhập nội dung câu hỏi..." />
                    </div>
                    {q.question_type === "FILL_BLANK" && (
                      <div className="lesson-field"><label>Đáp án đúng</label>
                        <input type="text" className="course-form-input" value={q.correct_text_answer || ""} onChange={e => updQ(si, li, qi, qIdx, "correct_text_answer", e.target.value)} placeholder="Nhập đáp án đúng" />
                      </div>
                    )}
                    {q.question_type === "MCQ" && (
                      <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="small">Đáp án</strong>
                          <button type="button" className="course-btn-sm course-btn-outline" onClick={() => addOpt(si, li, qi, qIdx)}><i className="bi bi-plus-lg me-1"></i> Thêm đáp án</button>
                        </div>
                        {(q.options || []).map((opt, oIdx) => (
                          <div key={oIdx} className="option-row">
                            <input type="text" className="course-form-input flex-grow-1" value={opt.text} onChange={e => updOpt(si, li, qi, qIdx, oIdx, "text", e.target.value)} placeholder={`Đáp án ${oIdx + 1}`} />
                            <label className="option-correct-label">
                              <input type="radio" name={`c-${si}-${li}-${qi}-${qIdx}`} checked={opt.is_correct} onChange={() => (q.options || []).forEach((_, oi) => updOpt(si, li, qi, qIdx, oi, "is_correct", oi === oIdx))} />
                              <span className="ms-1">Đúng</span>
                            </label>
                            <button type="button" className="course-btn-sm course-btn-danger ms-1" onClick={() => delOpt(si, li, qi, qIdx, oIdx)}><i className="bi bi-x-lg"></i></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  });

  return (
    <div className="instructor-courses-page">
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Tạo khóa học mới</h2>
          <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")}>
            <i className="bi bi-arrow-left me-1"></i> Quay lại
          </button>
        </div>

        <div className="course-form-content">
          {/* Thông tin cơ bản */}
          <div className="course-form-card mb-4">
            <h4 className="course-form-section-title">Thông tin cơ bản</h4>
            <div className="course-form-group">
              <label className="course-form-label">Tiêu đề <span className="text-danger">*</span></label>
              <input type="text" name="title" className="course-form-input" value={form.title} onChange={upd(form, setForm)} placeholder="VD: Lập trình Python từ cơ bản đến nâng cao" maxLength={50} />
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Mô tả <span className="text-danger">*</span></label>
              <textarea name="description" className="course-form-textarea" value={form.description} onChange={upd(form, setForm)} rows={4} placeholder="Mô tả chi tiết về khóa học..." />
            </div>
            <div className="course-form-row">
              <div className="course-form-group">
                <label className="course-form-label">Giá (VNĐ) <span className="text-danger">*</span></label>
                <input type="number" name="price" className="course-form-input" value={form.price} onChange={upd(form, setForm)} placeholder="VD: 499000" min="0" />
              </div>
              <div className="course-form-group">
                <label className="course-form-label">Danh mục <span className="text-danger">*</span></label>
                <select name="category" className="course-form-input" value={form.category} onChange={upd(form, setForm)}>
                  <option value="">-- Chọn --</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="course-form-group">
              <label className="course-form-label">Ảnh bìa</label>
              <div className="course-form-upload" onClick={() => document.getElementById("thumb-input").click()}>
                <input id="thumb-input" type="file" accept=".jpg,.jpeg,.png,.webp" className="d-none" onChange={onThumbnail} />
                {preview ? <img src={preview} alt="" className="course-form-upload-preview" /> : (
                  <div className="course-form-upload-placeholder"><i className="bi bi-cloud-upload"></i><span>Nhấp để tải ảnh bìa (tối đa 5MB)</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Chương & Bài học */}
          <div className="course-form-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="course-form-section-title mb-0">Chương & Bài học</h4>
              <button type="button" className="course-btn-primary course-btn-sm" onClick={addSection}><i className="bi bi-plus-lg me-1"></i> Thêm chương</button>
            </div>
            {sections.length === 0 && <p className="text-muted text-center py-4">Chưa có chương nào. Nhấn "Thêm chương" để bắt đầu.</p>}
            {sections.map((sec, si) => (
              <div key={si} className="section-card mb-3">
                <div className="section-card-header">
                  <div className="section-card-title"><i className="bi bi-folder me-2"></i>
                    <input type="text" className="section-title-input" value={sec.title} onChange={e => updSection(si, "title", e.target.value)} placeholder={`Chương ${si + 1}`} />
                  </div>
                  <div className="section-card-actions">
                    <button type="button" className="course-btn-sm course-btn-outline me-2" onClick={() => addLesson(si)}><i className="bi bi-plus-lg"></i> Thêm bài</button>
                    <button type="button" className="course-btn-sm course-btn-danger" onClick={() => delSection(si)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
                <div className="section-card-body">
                  <textarea className="course-form-textarea section-desc-input" value={sec.description} onChange={e => updSection(si, "description", e.target.value)} placeholder="Mô tả chương (không bắt buộc)" rows={2} />
                  {sec.lessons.map((les, li) => (
                    <div key={li} className="lesson-card">
                      <div className="lesson-card-header">
                        <div className="lesson-card-title"><i className="bi bi-play-circle me-2"></i>
                          <input type="text" className="lesson-title-input" value={les.title} onChange={e => updLesson(si, li, "title", e.target.value)} placeholder={`Bài ${li + 1}`} />
                        </div>
                        <button type="button" className="course-btn-sm course-btn-danger" onClick={() => delLesson(si, li)}><i className="bi bi-x-lg"></i></button>
                      </div>
                      <div className="lesson-card-body">
                        <textarea className="course-form-textarea" value={les.description} onChange={e => updLesson(si, li, "description", e.target.value)} placeholder="Mô tả bài học (không bắt buộc)" rows={2} />
                        <div className="lesson-fields-row">
                          <div className="lesson-field"><label>Loại</label>
                            <select value={les.content_type} onChange={e => updLesson(si, li, "content_type", e.target.value)} className="course-form-input">
                              <option value="VIDEO">Video</option><option value="DOCUMENT">Tài liệu</option>
                            </select>
                          </div>
                          <div className="lesson-field"><label>Miễn phí</label>
                            <select value={les.is_free ? "true" : "false"} onChange={e => updLesson(si, li, "is_free", e.target.value === "true")} className="course-form-input">
                              <option value="false">Không</option><option value="true">Có</option>
                            </select>
                          </div>
                        </div>
                        <div className="lesson-fields-row mt-2">
                          <div className="lesson-field">
                            <label>Tải tài liệu</label>
                            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="course-form-input" onChange={e => onFile(si, li, "material", e.target.files[0])} />
                            {files[`${si}-${li}`]?.material && <small className="text-success d-block mt-1"><i className="bi bi-check-circle me-1"></i>Đã chọn: {files[`${si}-${li}`].material.name}</small>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bài tập */}
          <div className="course-form-card mb-4">
            <h4 className="course-form-section-title mb-3">Bài tập cho từng bài học</h4>
            <p className="text-muted mb-3">Tạo bài tập trắc nghiệm, điền khuyết hoặc tự luận cho từng bài học.</p>
            {sections.length === 0 ? <p className="text-muted text-center py-4">Chưa có chương nào.</p> : sections.map((sec, si) => (
              <div key={si} className="section-card mb-3">
                <div className="section-card-header"><strong><i className="bi bi-folder me-2"></i>{sec.title || `Chương ${si + 1}`}</strong></div>
                <div className="section-card-body">{renderQuizSection(sec, si)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="course-form-actions">
          <button className="course-btn-outline" onClick={() => navigate("/instructor/courses")} disabled={loading}>
            <i className="bi bi-chevron-left me-1"></i> Hủy
          </button>
          <button className="course-btn-primary ms-auto" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-1"></span> Đang tạo...</> : <><i className="bi bi-check-lg me-1"></i> Tạo khóa học</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstructorCourseCreatePage;
