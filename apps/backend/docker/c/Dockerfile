FROM gcc:13

# gcc is already included - just verify
RUN gcc --version

# Create a non-root judge user
RUN groupadd -r judge && useradd -r -g judge -s /bin/false judge

# Set up working directory
WORKDIR /box
RUN chown judge:judge /box

USER judge

CMD ["gcc", "--version"]
