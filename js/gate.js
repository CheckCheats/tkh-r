/* theKing gate — do not pretty-print */
(function(w){
  "use strict";
  var _0xA=[98,83,194,104,21,191,52,85,214,102,15,96,68,216,152,87,108,129,218,171,48,2,198,220,135,149,229,20,76,172,173,14,54,206,3,218,168,188,179,108,184,77,99,197,142,229,149,8,52,144,211,172,68,211,94,137,20,254,170,18,39,205,253,48,188,139,8,36,239,202,151,56,72,13,33,138,175,182,172,155,246,114,12,247,110,176,14,105,54,39,244,67,25,173,213,72,25,193,125,239,105,160,199,75,229,117,124];
  var _0xB=[16,42,31,74,2,49,78,35,47,38,100,33,76,26,71,56,77,50,30,82,59,41,45,7,105,106,63,61,75,87,62,21,39,85,81,6,9,103,67,54,89,55,72,65,11,3,91,60,79,51,46,69,94,86,37,48,99,44,102,57,58,27,4,18,88,104,1,53,5,43,12,98,96,40,19,52,68,28,8,66,84,93,22,25,13,24,101,97,0,15,10,17,20,23,32,95,80,90,34,64,92,29,70,36,83,14,73];
  var _0xK=90;
  function _u(){
    var t=new Array(_0xA.length);
    for(var i=0;i<_0xA.length;i++){
      var j=_0xB[i];
      t[j]=_0xA[i]^((_0xK+(j*13))&255);
    }
    var s="";
    for(var k=0;k<t.length;k++) s+=String.fromCharCode(t[k]);
    return s;
  }
  function _wk(){
    var p=[20,26,8,31];
    return p[0]*1000000+p[1]*10000+p[2]*100+p[3];
  }
  function _dec(buf){
    var u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);
    var n=u8.length, egg=[20320,30475,20320,22920,22920,21602], love=[108,111,118,101], ypr=[89,111,117,32,80,108,97,121,32,82,111,98,108,111,120], day=19450815, key=_wk();
    var out=new Uint8Array(n);
    for(var i=0;i<n;i++){
      var pos=(i+1)*31+n*7+egg[i%egg.length]+love[i%love.length]+ypr[i%ypr.length]+day+key;
      out[i]=(u8[i]-pos%256+256)%256;
    }
    return new TextDecoder("utf-8").decode(out);
  }
  function _today(){
    var d=new Date();
    var m=("0"+(d.getUTCMonth()+1)).slice(-2);
    var day=("0"+d.getUTCDate()).slice(-2);
    return d.getUTCFullYear()+"-"+m+"-"+day;
  }
  function _ok(entry){
    if(!entry||!entry.name) return false;
    if(!entry.until) return true;
    return entry.until>=_today();
  }
  async function _pull(urls){
    var last=null;
    for(var i=0;i<urls.length;i++){
      try{
        var r=await fetch(urls[i],{cache:"no-store"});
        if(!r.ok) throw new Error("http "+r.status);
        last=new Uint8Array(await r.arrayBuffer());
        if(last.length>8) return last;
      }catch(e){}
    }
    if(last) return last;
    throw new Error("名单不可达");
  }
  w.__TK={
    line:function(){ return _u(); },
    count:function(list){ return Array.isArray(list)?list.length:0; },
    unlock:async function(name, urls){
      var nm=String(name||"").replace(/^@/,"").trim();
      if(!nm) return {ok:false, reason:"empty"};
      var bin=await _pull(urls);
      var plain=_dec(bin);
      var list=JSON.parse(plain);
      if(!Array.isArray(list)) return {ok:false, reason:"bad"};
      var hit=null;
      for(var i=0;i<list.length;i++){
        if(String(list[i].name).toLowerCase()===nm.toLowerCase()){ hit=list[i]; break; }
      }
      if(!hit) return {ok:false, reason:"deny", count:list.length};
      if(!_ok(hit)) return {ok:false, reason:"expired", count:list.length};
      return {ok:true, line:_u(), count:list.length, until:hit.until||null};
    },
    peekCount:async function(urls){
      var bin=await _pull(urls);
      var list=JSON.parse(_dec(bin));
      return Array.isArray(list)?list.length:0;
    }
  };
})(window);
