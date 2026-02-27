FROM rust:1.85-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.toml
COPY src src

RUN cargo build --release

FROM debian:bookworm-slim AS runtime

COPY --from=builder /app/target/release/crispy-exchange /usr/local/bin/crispy-exchange

EXPOSE 8082 8083
CMD ["crispy-exchange"]
