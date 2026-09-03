#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${ECR_REGISTRY:-288761758164.dkr.ecr.ap-southeast-1.amazonaws.com}"
TAG="${IMAGE_TAG:-latest}"
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://community-forum.devfolio.uno:8080}"

FRONTEND_IMAGE="${REGISTRY}/community-forum-frontend:${TAG}"
BACKEND_IMAGE="${REGISTRY}/community-forum-backend:${TAG}"

usage() {
	cat <<EOF
Usage: $0 [--image frontend|backend|all]

Examples:
	$0                         Build and push frontend and backend
	$0 --image frontend       Build and push only frontend
	$0 --image backend        Build and push only backend

Environment variables:
	ECR_REGISTRY              ECR registry host
	IMAGE_TAG                 Image tag (default: latest)
	NEXT_PUBLIC_API_URL       API URL compiled into the frontend
EOF
}

build_frontend() {
	echo "Building ${FRONTEND_IMAGE}..."
	docker build \
		--build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
		-t "${FRONTEND_IMAGE}" \
		./frontend-app

	echo "Pushing ${FRONTEND_IMAGE}..."
	docker push "${FRONTEND_IMAGE}"
}

build_backend() {
	echo "Building ${BACKEND_IMAGE}..."
	docker build \
		-t "${BACKEND_IMAGE}" \
		./springboot-app

	echo "Pushing ${BACKEND_IMAGE}..."
	docker push "${BACKEND_IMAGE}"
}

image="all"
while [[ $# -gt 0 ]]; do
	case "$1" in
		--image)
			if [[ $# -lt 2 ]]; then
				echo "Error: --image requires frontend, backend, or all." >&2
				usage >&2
				exit 2
			fi
			image="$2"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Error: unknown argument '$1'." >&2
			usage >&2
			exit 2
			;;
	esac
done

case "${image}" in
	frontend)
		build_frontend
		;;
	backend)
		build_backend
		;;
	all)
		build_frontend
		build_backend
		;;
	*)
		echo "Error: invalid image '${image}'. Use frontend, backend, or all." >&2
		usage >&2
		exit 2
		;;
esac

echo "Done."