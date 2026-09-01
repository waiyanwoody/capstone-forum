# 1. Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Optimize layer caching for dependencies
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copy source code and build final jar
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -B

# 2. Production stage
FROM eclipse-temurin:17-jre-alpine AS final

# Run as a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Ensure uploads directory exists with correct permissions
RUN mkdir -p uploads && chown -R appuser:appgroup /app

# Copy artifact from build stage
COPY --from=build --chown=appuser:appgroup /app/target/CommunityForum-*.jar app.jar

USER appuser

EXPOSE 8080

# Configure memory limits dynamically for Docker/Kubernetes environments
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]