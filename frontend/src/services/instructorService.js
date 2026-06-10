import {
  applyInstructorApi,
  getMyInstructorApplicationApi,
  uploadCertificateApi,
  getCertificatesApi,
  deleteCertificateApi,
  previewCertificateApi,
  previewCvApi,
} from "../api/userAPI";

export const submitApplication = async (formData) => {
  return await applyInstructorApi(formData);
};

export const getMyApplication = async () => {
  const data = await getMyInstructorApplicationApi();
  return data.application || null;
};

export const getCertificates = async (applicationId) => {
  return await getCertificatesApi(applicationId);
};

export const uploadCertificate = async (applicationId, title, file) => {
  return await uploadCertificateApi(applicationId, title, file);
};

export const deleteCertificate = async (applicationId, certificateId) => {
  return await deleteCertificateApi(applicationId, certificateId);
};

export const uploadPendingCertificates = async (applicationId, tempCertificates) => {
  let uploadedCount = 0;
  const errors = [];

  for (const cert of tempCertificates) {
    try {
      await uploadCertificateApi(applicationId, cert.title, cert.file);
      uploadedCount++;
    } catch (error) {
      errors.push({ title: cert.title, message: error.message });
    }
  }

  return { uploadedCount, errors };
};

export const getPreviewCertificateUrl = (applicationId, certificateId) => {
  return previewCertificateApi(applicationId, certificateId);
};

export const getPreviewCvUrl = (applicationId) => {
  return previewCvApi(applicationId);
};
