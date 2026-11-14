"""Apply loopback-only settings to an already initialized private sandbox home."""
import json, pathlib, sys
home=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.build/sandbox-home')
config=home/'config.json';c=json.loads(config.read_text());n=c['network'];key=json.loads((home/'node_key.json').read_text())['public_key']
n['addr']='127.0.0.1:24568';n['boot_nodes']='';n['whitelist_nodes']='';n['trusted_stun_servers']=[];n['tier1']['enable_inbound']=False;n['tier1']['enable_outbound']=False;n['experimental']['network_config_overrides']['outbound_disabled']=True;n['public_addrs']=[key+'@127.0.0.1:24568'];n['allow_private_ip_in_public_addrs']=True;n['minimum_outbound_peers']=0;c['rpc']['addr']='127.0.0.1:3030';c['telemetry']['endpoints']=[];c['consensus']['min_num_peers']=0
config.write_text(json.dumps(c,indent=2)+'\n')
