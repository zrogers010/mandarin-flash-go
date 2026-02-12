# Build stage
FROM golang:1.24-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Development stage with Air for hot reload
FROM golang:1.24-alpine AS development

# Install Air for hot reload (using a specific working version)
RUN go install github.com/cosmtrek/air@v1.49.0

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Create Air configuration
RUN echo 'root = "."' > .air.toml && \
    echo 'testdata_dir = "testdata"' >> .air.toml && \
    echo 'tmp_dir = "tmp"' >> .air.toml && \
    echo '' >> .air.toml && \
    echo '[build]' >> .air.toml && \
    echo '  args_bin = []' >> .air.toml && \
    echo '  bin = "./tmp/main"' >> .air.toml && \
    echo '  cmd = "go build -o ./tmp/main ./cmd/server/main.go"' >> .air.toml && \
    echo '  delay = 1000' >> .air.toml && \
    echo '  exclude_dir = ["assets", "tmp", "vendor", "testdata"]' >> .air.toml && \
    echo '  exclude_file = []' >> .air.toml && \
    echo '  exclude_regex = ["_test.go"]' >> .air.toml && \
    echo '  exclude_unchanged = false' >> .air.toml && \
    echo '  follow_symlink = false' >> .air.toml && \
    echo '  full_bin = ""' >> .air.toml && \
    echo '  include_dir = []' >> .air.toml && \
    echo '  include_ext = ["go", "tpl", "tmpl", "html"]' >> .air.toml && \
    echo '  include_file = []' >> .air.toml && \
    echo '  kill_delay = "0s"' >> .air.toml && \
    echo '  log = "build-errors.log"' >> .air.toml && \
    echo '  poll = false' >> .air.toml && \
    echo '  poll_interval = 0' >> .air.toml && \
    echo '  rerun = false' >> .air.toml && \
    echo '  rerun_delay = 500' >> .air.toml && \
    echo '  send_interrupt = false' >> .air.toml && \
    echo '  stop_on_root = false' >> .air.toml && \
    echo '' >> .air.toml && \
    echo '[color]' >> .air.toml && \
    echo '  app = ""' >> .air.toml && \
    echo '  build = "yellow"' >> .air.toml && \
    echo '  main = "magenta"' >> .air.toml && \
    echo '  runner = "green"' >> .air.toml && \
    echo '  watcher = "cyan"' >> .air.toml && \
    echo '' >> .air.toml && \
    echo '[log]' >> .air.toml && \
    echo '  main = ""' >> .air.toml && \
    echo '  main_only = false' >> .air.toml && \
    echo '  time = false' >> .air.toml && \
    echo '' >> .air.toml && \
    echo '[misc]' >> .air.toml && \
    echo '  clean_on_exit = false' >> .air.toml

# Expose port
EXPOSE 8080

# Run Air for development
CMD ["/go/bin/air"]

# Production stage
FROM alpine:latest AS production

# Install ca-certificates
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 