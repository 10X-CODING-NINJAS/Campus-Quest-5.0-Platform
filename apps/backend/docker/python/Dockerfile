FROM python:3.12-alpine

# Install any commonly needed packages
RUN pip install --no-cache-dir \
    sortedcontainers \
    sympy

# Create a non-root judge user
RUN addgroup -S judge && adduser -S judge -G judge

# Set up working directory
WORKDIR /box
RUN chown judge:judge /box

USER judge

CMD ["python3", "--version"]
