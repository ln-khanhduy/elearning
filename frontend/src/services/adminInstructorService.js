import {getInstructorApplicationsApi,reviewInstructorApplicationApi,previewCertificateApi,previewCvApi,} from "../api/userAPI";

export const getApplications = async (statusFilter = "") => {
  return await getInstructorApplicationsApi(statusFilter);
};

export const reviewApplication = async (applicationId, data) => {
  return await reviewInstructorApplicationApi(applicationId, data);
};

export const getPreviewCertificateUrl = (applicationId, certificateId) => {
  return previewCertificateApi(applicationId, certificateId);
};

export const getPreviewCvUrl = (applicationId) => {
  return previewCvApi(applicationId);
};
