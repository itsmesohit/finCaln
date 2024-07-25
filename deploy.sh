docker build -t itsmesohit/multi-client:latest -t itsmesohit/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t itsmesohit/multi-server:latest -t itsmesohit/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t itsmesohit/multi-worker:latest -t itsmesohit/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push itsmesohit/multi-client:latest
docker push itsmesohit/multi-server:latest
docker push itsmesohit/multi-worker:latest

docker push itsmesohit/multi-client:$SHA
docker push itsmesohit/multi-server:$SHA
docker push itsmesohit/multi-worker:$SHA

kubectl apply -f k8s

kubectl set image deployments/server-deployment server=itsmesohit/multi-server:$SHA
kubectl set image deployments/client-deployment client=itsmesohit/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=itsmesohit/multi-worker:$SHA