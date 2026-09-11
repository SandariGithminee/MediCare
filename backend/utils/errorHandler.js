/**
 * Formats database and system errors into clean, user-friendly messages.
 * Prevents raw PostgreSQL/SQL driver error codes from leaking to the frontend.
 */
function formatErrorMessage(err) {
  if (!err) return "An unexpected error occurred. Please try again.";

  // If already a simple user-facing string
  if (typeof err === "string") return err;

  // Check PostgreSQL error codes
  if (err.code) {
    switch (err.code) {
      case "23505": { // unique_violation
        const detail = err.detail || "";
        const match = detail.match(/Key \((.*?)\)=\((.*?)\) already exists/);
        if (match) {
          const field = match[1].replace(/_/g, " ");
          const val = match[2];
          return `A record with this ${field} ("${val}") already exists.`;
        }
        return "A record with this information already exists.";
      }
      case "23502": { // not_null_violation
        const col = err.column ? err.column.replace(/_/g, " ") : "required field";
        return `Please provide a valid ${col}. It cannot be left blank.`;
      }
      case "23503": { // foreign_key_violation
        return "The referenced item (patient, doctor, or record) could not be found. Please check your selection.";
      }
      case "22P02": { // invalid_text_representation (e.g. NaN or invalid UUID/integer)
        if (err.message && err.message.includes('"NaN"')) {
          return "Please enter a valid numeric value for number fields.";
        }
        return "One of the entered values is in an invalid format. Please check your entries.";
      }
      case "22001": { // string_data_right_truncation
        return "One of the text fields exceeds the maximum allowed length. Please shorten your input.";
      }
      case "22007": // invalid_datetime_format
      case "22008": {
        return "Please enter a valid date and time in the correct format.";
      }
      case "23514": { // check_violation
        return "The entered data does not meet validation criteria. Please verify your inputs.";
      }
      case "42P01": { // undefined_table
        return "Service temporarily unavailable. Database table not initialized.";
      }
      case "08006": // connection failure
      case "08001":
      case "ECONNREFUSED": {
        return "Database service is temporarily unreachable. Please try again in a few moments.";
      }
    }
  }

  // Parse common message substrings
  const msg = err.message || "";

  if (msg.includes("invalid input syntax for type integer")) {
    return "Please enter a valid whole number for numeric fields.";
  }
  if (msg.includes("violates not-null constraint")) {
    return "Please complete all mandatory fields.";
  }
  if (msg.includes("violates unique constraint")) {
    return "A record with this unique information already exists.";
  }
  if (msg.includes("violates foreign key constraint")) {
    return "The selected record was not found.";
  }

  // If the error message is clean and readable (not containing SQL syntax jargon)
  if (
    !msg.includes("SELECT") &&
    !msg.includes("INSERT INTO") &&
    !msg.includes("UPDATE") &&
    !msg.includes("syntax error") &&
    !msg.includes("relation") &&
    !msg.includes("pg_") &&
    msg.length > 0 &&
    msg.length < 200
  ) {
    return msg;
  }

  return "An unexpected error occurred. Please check your details and try again.";
}

module.exports = { formatErrorMessage };
