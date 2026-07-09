FROM gcc:13

# Install g++ (already included in gcc image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root judge user
RUN groupadd -r judge && useradd -r -g judge -s /bin/false judge

# Set up working directory
WORKDIR /box
RUN chown judge:judge /box

USER judge

# Default: just print version (actual commands passed at runtime)
CMD ["g++", "--version"]
