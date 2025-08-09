import React from "react";

function logErrorToMyService(error: unknown, errorInfo: unknown) {
    console.error(error, errorInfo);
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, errorInfo: unknown) {
        logErrorToMyService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}
