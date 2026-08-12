New-NetFirewallRule -DisplayName "ChatApp Backend 5000 IN" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "ChatApp Backend 5000 OUT" -Direction Outbound -Protocol TCP -LocalPort 5000 -Action Allow
Write-Host "Firewall rules added successfully for port 5000!"
