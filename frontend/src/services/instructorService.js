import {applyInstructorApi} from "../api/userAPI";

export const submitApplication = async (formData) => {
  return await applyInstructorApi(formData);
};
