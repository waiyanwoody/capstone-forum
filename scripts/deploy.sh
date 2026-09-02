NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://18.141.189.149:8080}"
docker build --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" -t community-forum-frontend ./frontend-app

docker build -t community-forum-backend ./springboot-app