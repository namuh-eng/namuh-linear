/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    if (process.env.EXPONENTIAL_HEADLESS_DIRECT_API_REWRITE === "false") {
      return [];
    }

    const apiUrl = process.env.EXPONENTIAL_API_URL?.replace(/\/$/, "");
    const kratosUrl = process.env.EXPONENTIAL_KRATOS_PUBLIC_URL?.replace(
      /\/$/,
      "",
    );
    if (!apiUrl && !kratosUrl) {
      return [];
    }

    return {
      beforeFiles: [
        ...(kratosUrl
          ? [
              {
                source: "/api/auth/kratos/:path*",
                destination: `${kratosUrl}/:path*`,
              },
            ]
          : []),
        ...(apiUrl
          ? [
              {
                source: "/api/:path*",
                destination: `${apiUrl}/:path*`,
              },
            ]
          : []),
      ],
    };
  },
};

module.exports = nextConfig;
