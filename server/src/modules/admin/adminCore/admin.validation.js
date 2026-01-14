import {
  emailValidator,
  passwordValidator,
  passwordRequiredValidator,
} from "../../../validators/common.validators.js";

export const loginAdminValidator = [
  emailValidator,
  passwordValidator,
  passwordRequiredValidator,
];
