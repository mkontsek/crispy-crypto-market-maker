FROM rust:1.85-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.toml
COPY src src

RUN cargo build --release

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/crispy-bot /usr/local/bin/crispy-bot

EXPOSE 8080 8081
CMD ["crispy-bot"]

