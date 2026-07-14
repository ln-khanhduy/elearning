import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary d-flex flex-column align-items-center justify-content-center py-5">
          <div className="text-center" style={{ maxWidth: 500 }}>
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: 48 }}></i>
            <h3 className="mt-3">Đã xảy ra lỗi</h3>
            <p className="text-muted">
              {this.props.fallbackMessage || "Có lỗi xảy ra khi tải trang này. Vui lòng thử lại sau."}
            </p>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button
                className="btn btn-primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>Thử lại
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => window.location.href = "/home"}
              >
                <i className="bi bi-house me-1"></i>Về trang chủ
              </button>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="mt-3 text-start bg-light p-3 rounded" style={{ fontSize: 12, maxHeight: 200, overflow: "auto" }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;