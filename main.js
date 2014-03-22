;(function(win){
  var CACHE_DATA={};
  var _meta={
    ar:"artist",
    ti:"title",
    al:"album",
    by:"by"
  };
  function eachLrc(data,fn){
    if(data && typeof data==='string'){
      data=data.split(/\n/);
      var len,i,tmp,tmpval;
      if(typeof fn!=='function'){
        return;
      }
      for(i=0,len=data.length;i<len;i++){
        tmp=data[i];
        if(/\[(.*)\](.*)/.test(tmp)){
          tmp=RegExp.$1;
          tmpval=RegExp.$2;
          tmp=tmp.split("][");
          fn(tmp,tmpval);
        }else{
          fn("",tmp);
        }
      }
    }
  }
  function formatLrc(meta,data,result){
    if(meta.length){
      var i,tmp,val,val2,tmpKey,offset=0;
      for( i=0;tmp=meta[i++];){
        if(/(.*)\:(.*)/.test(tmp)){
          val = RegExp.$1;
          val2= RegExp.$2;
          val=val.trim();
          if(val==='offset'){
            offset = parseInt(val2) || 0;
          }
          if( val in _meta){
            result[_meta[val]] = val2 || data || "雷锋、红领巾";/*兼容某些非规则写法[ar:]xxx*/
          }else{
            val  = parseInt(val)*60000;
            val2 = parseFloat(val2).toFixed(3)*1000;
            if(!isNaN(val) && !isNaN(val2)){
              tmpKey=val+val2+offset;
              result.time.push(tmpKey);
              result.data[tmpKey]=data;
            }
          }
        }
      }
    }else{
      result.noMeta.push(data);
    }
  }
/*=========================================================*/
var _storagekey="bubbler_song_info";
var _url="http://geci.me/api/lyric/{song}/{artist}";
var currentId=0;
var CurrentSong;
var EL;
var List;
var ContentTitle;
var ContentBox;
var LRC_TC;
var currentSongInfo;
/**==========================================================**/

function getSongInfo(){
  var value=JSON.parse(localStorage.getItem(_storagekey));
  return value?{id:value.id,song:value.song_name,artist:value.artist}:"";
}
function doRequest(url,success,fail,json){
  var XHR=new XMLHttpRequest();
  XHR.onreadystatechange=function(){
    if (XHR.readyState == 4) {
      if (XHR.status == 200) {
        var value=XHR.responseText;
            try{
              json && (value=JSON.parse(value));
            }catch(e){}
        success && success(value);
      }else{
        fail && fail();
      }
    }
  }
  XHR.open('GET', url, true);
  XHR.send();
}
function getLrcListByName(songInfo,renderList){
  var url=_url.replace("{song}",songInfo.song);
  if(songInfo.artist){
    url=url.replace("{artist}",songInfo.artist.replace("/",""));
  }else{
    url=url.replace("/{artist}","");
  }
  doRequest(url,function(data){
    renderList(data);
  },function(){},true);
}
function getLrc(data,success,fail){
  var url=data.lrc;
  doRequest(url,function(data){
    success(data);
  },fail);
}
function pullRenderLrc(result,Current){
  var st=Math.max(Current-2,0);
  var end=st+5;
  var tmparr=result.time.slice( st , end );
  var html=['<ul>'];
  tmparr.forEach(function(item){
     html.push( "<li>"+( result.data[item] || " ")+"</li>");
  });
  html.push("</ul>")
  ContentBox.innerHTML=html.join("");
}
function initLrcInfo(data){
  var result={artist:"未知",title:"未知",album:"未知",by:"雷锋、红领巾",data:{},noMeta:[],time:[]};
  eachLrc(data,function(a,b){
    formatLrc(a,b,result);
  });
  result.time.length && result.time.sort(function(a,b){
    if(a>b){
      return 1;
    }else{
      return -1;
    }
  });
  console.log(currentSongInfo);
  ContentTitle.innerHTML='<a target="_blank" href="http://google.com.hk/search?q='+encodeURIComponent(result.by)+'">'+result.by+'<a>'
  if(result.time.length){
    var BeginTime=new Date().getTime();
    var Current=0;
    pullRenderLrc(result,Current);
    var showLrc=function(){
      var time=new Date().getTime();
      var tmp=result.time[Current];
      if(typeof tmp==='number'){
        if(time-BeginTime - tmp >=0 ){
          Current++;
          pullRenderLrc(result,Current)
        }
        LRC_TC=setTimeout(function(){
          showLrc();
        },20);
      }else{
        clearTimeout(LRC_TC)
      }
    }
    showLrc();
  }else{
    ContentBox.innerHTML=result.noMeta.join("<br>");
  }
}
function getList(songInfo){
  getLrcListByName(songInfo,function(data){
    if(data && data.code===0 && data.count){
      getLrc(data.result[0],initLrcInfo,function(){
         data.count>1 && getLrc(data.result[1],initLrcInfo);
      });
    }else{
      ContentBox.innerHTML="没有找到歌词";
    }
  });
}
function resetContent(){
  clearTimeout(LRC_TC);
  ContentBox.innerHTML="正在查询歌词";
  ContentTitle.innerHTML=""
}
function runPull(){
 var songInfo=getSongInfo();
  if(songInfo){
    if(currentId!==songInfo.id){
      currentId=songInfo.id;
      currentSongInfo=songInfo;
      resetContent();
      getList(songInfo);
    }
  }
  setTimeout(runPull,1000)
}
function insertStyle(cssText){
  var styleEl=document.createElement("style");
  styleEl.innerHTML=cssText;
  document.body.appendChild(styleEl);
}
function init(tmpl,cssText){
  var EL=document.createElement("div");
  EL.id="doubanlrc-container";
  EL.className='doubanlrc-container';
  EL.innerHTML=tmpl;
  document.body.appendChild(EL);
  ContentTitle=document.getElementById("doubanlrc_content_title");
  ContentBox=document.getElementById("doubanlrc_content_box");
  ListEL=document.getElementById("doubanlrc_list_num");
  insertStyle(cssText);
  runPull();
}
var _tmpl="<div class='doubanlrc-list' id='doubanlrc_list'>\
            <div class='doubanlrc-list-num' id='doubanlrc_list_num'>\
            </div>\
          </div>\
          <div class='doubanlrc-content' id='doubanlrc_content'>\
            <div class='doubanlrc-content-title' >\
               <p style='font-size:14px'>特别感谢</p>\
               <p>&nbsp;&nbsp;&nbsp;&nbsp;歌词整理：<br/>\
               <b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span id='doubanlrc_content_title'></span></b></p>\
               <p>&nbsp;&nbsp;&nbsp;&nbsp;API：<span style='cursor:pointer' onclick='location.href=\"http://geci.me\"'>歌词迷</span></p>\
            </div>\
            <div class='doubanlrc-content-box' id='doubanlrc_content_box'>\
            </div>\
          </div>";
var cssText='\
  .doubanlrc-container{height:101px;width:514px;position:absolute;z-index:100;left:50%;top:336px;margin-left:-62px;text-align:center;background:rgb(198,211,205);overflow:auto;padding:5px 0;}\
  .doubanlrc-content-title{padding-left:10px;width:110px;float:left;text-align:left}\
  .doubanlrc-content-box{width:350px;float:right;}\
  .doubanlrc-content-title,.doubanlrc-content-box{height:100px;}\
';
init(_tmpl,cssText);
})(window);