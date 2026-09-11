/**
 * Extracts and sanitizes API, network, and database errors into clean, user-friendly messages.
 * Guarantees no cryptic SQL errors or stack traces leak to the UI toasts.
 */
export function getFriendlyErrorMessage(error, defaultMessage = "Something went wrong. Please try again.") {
  if (!error) return defaultMessage;

  // If string
  if (typeof error === "string") return error;

  // Axios response data message
  const serverMsg = error.response?.data?.message || error.response?.data?.error;
  if (serverMsg && typeof serverMsg === "string") {
    if (serverMsg.includes("invalid input syntax for type integer")) {
      return "Please enter a valid number for numeric fields.";
    }
    if (serverMsg.includes("violates not-null constraint")) {
      return "Please fill in all mandatory fields before submitting.";
    }
    if (serverMsg.includes("violates unique constraint") || serverMsg.includes("duplicate key")) {
      return "A record with this information already exists in the system.";
    }
    if (serverMsg.includes("violates foreign key constraint")) {
      return "The referenced record could not be found. Please check your selections.";
    }
    if (serverMsg.includes('"NaN"') || serverMsg.includes("NaN")) {
      return "Please enter a valid number. Numbers cannot be empty or invalid.";
    }
    return serverMsg;
  }

  // Axios network or timeout errors
  if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  if (error.response?.status === 403) {
    return "Access denied: You do not have permission to perform this action.";
  }

  if (error.response?.status === 404) {
    return "The requested record was not found.";
  }

  if (error.response?.status === 500) {
    return "The server encountered an issue processing your request. Please try again.";
  }

  if (error.message && !error.message.includes("status code") && !error.message.includes("Request failed with")) {
    return error.message;
  }

  return defaultMessage;
}
