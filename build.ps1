# settings environment variables
# setting os for running on server rasppi
$env:GOARCH="arm64"
$env:GOOS="linux"

cd .\backend
go build main.go

Write-Host "Go file built for $env:GOOS - $env:GOARCH"