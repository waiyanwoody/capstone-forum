# 1. Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Step A: Copy pom.xml and download dependencies into a dedicated layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Step B: Copy source code and package
COPY src ./src
RUN mvn package -DskipTests -B

# 2. Production stage
FROM eclipse-temurin:17-jre-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

RUN mkdir -p uploads && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/target/CommunityForum-*.jar app.jar

USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]