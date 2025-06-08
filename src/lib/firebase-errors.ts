import { FirebaseError } from "firebase/app";

export interface FirebaseErrorInfo {
  message: string;
  userMessage: string;
  code: string;
}

export function handleFirebaseError(error: FirebaseError): FirebaseErrorInfo {
  console.error("Firebase Error:", error);

  const errorInfo: FirebaseErrorInfo = {
    message: error.message,
    userMessage: "Đã xảy ra lỗi. Vui lòng thử lại.",
    code: error.code,
  };

  // Auth errors
  switch (error.code) {
    case "auth/user-not-found":
      errorInfo.userMessage = "Không tìm thấy tài khoản với email này.";
      break;
    case "auth/wrong-password":
      errorInfo.userMessage = "Mật khẩu không chính xác.";
      break;
    case "auth/invalid-email":
      errorInfo.userMessage = "Email không hợp lệ.";
      break;
    case "auth/user-disabled":
      errorInfo.userMessage = "Tài khoản đã bị vô hiệu hóa.";
      break;
    case "auth/too-many-requests":
      errorInfo.userMessage = "Quá nhiều lần thử. Vui lòng thử lại sau.";
      break;
    case "auth/network-request-failed":
      errorInfo.userMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra internet.";
      break;

    // Firestore errors
    case "permission-denied":
      errorInfo.userMessage = "Bạn không có quyền thực hiện thao tác này.";
      break;
    case "not-found":
      errorInfo.userMessage = "Không tìm thấy dữ liệu được yêu cầu.";
      break;
    case "already-exists":
      errorInfo.userMessage = "Dữ liệu đã tồn tại.";
      break;
    case "resource-exhausted":
      errorInfo.userMessage = "Hệ thống đang quá tải. Vui lòng thử lại sau.";
      break;
    case "cancelled":
      errorInfo.userMessage = "Thao tác đã bị hủy.";
      break;
    case "data-loss":
      errorInfo.userMessage = "Dữ liệu bị mất. Vui lòng liên hệ quản trị viên.";
      break;
    case "unauthenticated":
      errorInfo.userMessage = "Vui lòng đăng nhập để tiếp tục.";
      break;
    case "unavailable":
      errorInfo.userMessage =
        "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
      break;
  }

  return errorInfo;
}

export function isFirebaseError(error: any): error is FirebaseError {
  return (
    error && typeof error.code === "string" && typeof error.message === "string"
  );
}
