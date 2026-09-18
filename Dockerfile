# Stage 1: install gems into a layer cache
FROM ruby:3.2-alpine AS deps
RUN apk add --no-cache build-base git
WORKDIR /site
COPY Gemfile Gemfile.lock* ./
RUN bundle install

# Stage 2: dev server (gems copied, source bind-mounted at runtime)
FROM ruby:3.2-alpine AS dev
RUN apk add --no-cache build-base git nodejs
COPY --from=deps /usr/local/bundle /usr/local/bundle
WORKDIR /site
EXPOSE 4000 35729
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--livereload", "--force_polling"]
