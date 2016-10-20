/**
 * Created by HidyChen on 16/10/18.
 */
self.addEventListener('message', function(e) {
    var data = e.data;
    try {
        var reader = new FileReaderSync();
        postMessage({
            result: reader.readAsDataURL(data)
        });
    } catch(e){
        postMessage({
            result:'error'
        });
    }
}, false);