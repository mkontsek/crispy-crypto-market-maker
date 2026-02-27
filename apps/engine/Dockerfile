FROM rust:1.85-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.toml
COPY src src

RUN cargo build --release

FROM debian:bookworm-slim AS runtime

COPY --from=builder /app/target/release/crispy-engine /usr/local/bin/crispy-engine

EXPOSE 8080 8081
CMD ["crispy-engine"]
