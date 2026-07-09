FROM eclipse-temurin:21-jdk-alpine

# Create a non-root judge user
RUN addgroup -S judge && adduser -S judge -G judge

# Set up working directory
WORKDIR /box
RUN chown judge:judge /box

USER judge

CMD ["java", "--version"]
