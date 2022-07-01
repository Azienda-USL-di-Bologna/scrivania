//**********************************
// Assistenza 001285-2017
// Videate che in apertura generano errori javascript
// Verrà corretto in un prossimo rilascio della 16.5
//**********************************
IDPanel.prototype.AdaptLayout = function()
{ 
  // Per migliorare le performance, elimino la listlistbox dal dom (non per IE6 che ha problemi con i check box!)
  var refoc = null;
  var removeFromDOM = (RD3_Glb.IsIE(10, false) && !RD3_Glb.IsIE(6) && this.PanelMode==RD3_Glb.PANEL_LIST && this.FixedColumns==0);
  if (removeFromDOM)
  {
    // Se l'oggetto che aveva il fuoco era dentro al pannello, IE lo perde!
    var oldActiveElem = document.activeElement;
    //
    this.ContentBox.removeChild(this.ListBox);
    //
    if (document.activeElement != oldActiveElem)
      refoc = oldActiveElem;
  }
  //
  // Se presenti dimensiono le linguette delle pagine
  // Lo faccio prima della chiamata alla classe base in modo che
  // essa puo' mettere a posto bene il content box
  if (this.Pages.length > 0)
  {
    // Se sono dentro una Tab prima di fare l'adattamento delle pagine devo dimensionare correttamente il FrameBox
    // se no vengono disegnate male..
    if (this.ParentTab)
    {
      RD3_Glb.AdaptToParent(this.FrameBox, 0, 0);
    }
    //
    this.AdaptPagesLayout();
  }
  //
  var res = this.SendResize;
  //
  // Chiamo la classe base
  var flDontCheckSB = false;
  WebFrame.prototype.AdaptLayout.call(this);
  //
  // Non dovrei ridimensionare... Pero' se ho posticipato un resize lo devo fare comunque
  if (!res)
  {
    res |= (this.PanelMode==RD3_Glb.PANEL_FORM && (this.MustResizeFormW || this.MustResizeFormH)) | 
           (this.PanelMode==RD3_Glb.PANEL_LIST && (this.MustResizeListW || this.MustResizeListH));
  }
  //
  if (res || (this.ResVisFld && this.ResOnlyVisFlds))
  {
    // A parte Safari, gli altri brw calcolano immediatamente la scrollbar nel contentbox
    if (!RD3_Glb.IsSafari() && this.DeltaW<0)
      flDontCheckSB = true;
    //
    // Chiamo il resize dei campi in form e in lista
    if (this.HasForm)
    {
      // Dunque... ho la form... se sono in form, ridimensiono la form... Se avevo posticipato il resize prendo
      // i delta che non ho fatto... se, invece, il layout attivo non e' quello giusto mi ricordo che quando cambiero'
      // layout dovro' ridimensionare il layout form
      if (this.PanelMode==RD3_Glb.PANEL_FORM && this.Visible)
      {
        if (!this.DeltaW && this.MustResizeFormW) this.DeltaW = this.MustResizeFormW;
        if (!this.DeltaH && this.MustResizeFormH) this.DeltaH = this.MustResizeFormH;
        this.ResizeForm();
        this.MustResizeFormW = 0;
        this.MustResizeFormH = 0;
      }
      else if (this.LastFormResizeW==0 && (this.DeltaW || this.DeltaH))   // Solo se non ho mai resizato il layout form... mi ricordo di questi delta
      {
        this.MustResizeFormW = (this.MustResizeFormW==undefined ? 0 : this.MustResizeFormW) + this.DeltaW;
        this.MustResizeFormH = (this.MustResizeFormH==undefined ? 0 : this.MustResizeFormH) + this.DeltaH;
      }
    }
    if (this.HasList)
    {
      // Dunque... ho la lista... se sono in list, ridimensiono la lista... Se avevo posticipato il resize prendo
      // i delta che non ho fatto... se, invece, il layout attivo non e' quello giusto mi ricordo che quando cambiero'
      // layout dovro' ridimensionare il layout list
      if (this.PanelMode==RD3_Glb.PANEL_LIST && this.Visible)
      {
        if (!this.DeltaW && this.MustResizeListW) this.DeltaW = this.MustResizeListW;
        if (!this.DeltaH && this.MustResizeListH) this.DeltaH = this.MustResizeListH;
        //
        // Se ho un resize non applicato lo devo considerare quando faccio i calcoli del delta.
        // Solo quando non sono attive le animazioni, altrimenti il codice li considera correttamente
/*        if (!RD3_ClientParams.EnableGFX && this.DeltaH != 0 && !this.MustResizeListH)
          this.DeltaH += this.MustResizeListH;
	  */
        //
        this.ResizeList();
        this.MustResizeListW = 0;
        this.MustResizeListH = 0;
      }
      else if (this.LastListResizeW==0 && (this.DeltaW || this.DeltaH))   // Solo se non ho mai resizato il layout lista... mi ricordo di questi delta
      {
        this.MustResizeListW = (this.MustResizeListW==undefined ? 0 : this.MustResizeListW) + this.DeltaW;
        this.MustResizeListH = (this.MustResizeListH==undefined ? 0 : this.MustResizeListH) + this.DeltaH;
      }
    }
    this.DeltaW = 0;
    this.DeltaH = 0;
    this.SetActualPosition();
    //
    if (RD3_Glb.IsMobile())
      this.RefreshToolbar = true;
  }
  this.ResVisFld = false;
  //
  // Aggiusto il layout
  if (this.PanelMode==RD3_Glb.PANEL_LIST)
  {
    this.CalcListLayout(flDontCheckSB);
    if (this.IsGrouped())
      this.CalcListGroupLayout();
  }
  //
  // Aggiusto il layout dei gruppi
  this.CalcGroupsLayout();
  //
  // Passo la palla ai figli, che potrebbero avere dei subframes
  // Se sono su IE, vedo se qualche campo ha un Sub-Frame... Se e' cosi' devo
  // rimettere subito nel DOM il pannello, altrimenti non funziona bene il resize...
  // Pero', se lo faccio dopo, e' molto piu' veloce
  var restoreListInDom = true;
  var n = this.Fields.length;
  for (var i=0; i<n; i++)
  {
    var f = this.Fields[i];
    //
    if (removeFromDOM && restoreListInDom && f.SubFrame && f.SubFrame.Realized && f.IsVisible())
    {
      // Hai... devo ripristinarlo qui!
      this.ContentBox.appendChild(this.ListBox);
      restoreListInDom = false;
    }
    //
    f.AdaptLayout();
  }  
  //
  // Su Safari e Chrome c'e' un baco con la gestione delle scrollbar, che rimangono anche se il pannello ci sta completamente, 
  // allora qui le tolgo e poi sara' la SetScrollbar a rimetterle (l'AdaptFormListLayout non legge le dimensioni dal DOM quindi la modifica non ha impatto su di lei)
  // facendo cosi' Safari e Chrome calcolano bene le scrollbar, togliendole se non servono.. lo devo fare qui per un motivo di tempi inspiegabile,
  // se lo faccio dopo l'AdaptFormListLayout o dentro la setScrollbar non funziona..
  if (RD3_Glb.IsChrome() || RD3_Glb.IsSafari())
  {
    this.ContentBox.style.overflowX = "hidden";
    this.ContentBox.style.overflowY = "hidden";
  }
  //
  // Ridimensiono i contenitori del pannello in lista e in form
  this.AdaptFormListLayout();
  //
  // Rimetto le scrollbar dove devo
  this.SetScrollbar();
  //
  // Mostro/Nascondo bottone carica altre righe
  if (this.MoreAreaBox)
  {
    this.MoreAreaBox.style.display = (this.TotalRows>this.NumRows)?"":"none";
    if (this.IsMyScroll() && this.IDScroll)
      this.IDScroll.MarginBottom = (this.TotalRows>this.NumRows)?40:0;
    this.MoreButton.className = "panel-more-button";
  }
  //
  // ora rimetto la listbox dal dom...
  if (removeFromDOM)
  {
    if (restoreListInDom)
      this.ContentBox.appendChild(this.ListBox);
    //
    // Devo riposizionare la scrollbar. Questa operazione l'ha sicuramente azzerata!
    this.QbeScroll = true;
    //
    // Se nel rimuovere la listbox dal dom ho perso il fuoco, lo rimetto a posto!
    if (refoc)
    {
      if (refoc.tagName == "DIV" && refoc.getAttribute("contenteditable") != "true")
        RD3_KBManager.CheckFocus=true;
      else
        refoc.focus();
    }
  }
  //
  // Con queste righe di codice si fanno sparire
  // le scrollbar che IE tende a mettere quando si rimpiccilisce lo spazio
  // disponibile
  // Se lo faccio durante un animazione di form/list e per caso il pannello ha le scrollbar queste righe fanno vedere per un istante la lista..
  // Lo stesso succede durante un animazione di collassamento
  if (!this.AnimatingPanel && !this.Collapsing)
  {
    var oldScrollTop = this.ContentBox.scrollTop;
    this.ContentBox.scrollTop = oldScrollTop + 1000;
    this.ContentBox.scrollTop = oldScrollTop;
  }
  //
  // Comunico a IDScroll che portrebbe essere cambiata l'altezza... 
  // ma non mentre sposto da lista a form e viceversa e poi solo se e' MIO
  // se c'e' l'ha una combo che si sta spostando non va bene
  if (this.IsMyScroll() && this.PullAreaBox && this.PanelMode==RD3_Glb.PANEL_LIST)
  {
    this.IDScroll.PullTrigger = -this.PullAreaBox.offsetTop+this.PullAreaBox.offsetHeight/2;
    //
    // Nel caso quadro esiste un'area coperta piu' grande, ma deve funzionare come prima
    if (RD3_Glb.IsQuadro())
      this.IDScroll.PullTrigger -= 40;
  }
  else if (this.IDScroll)
    this.IDScroll.PullTrigger = 0;
  //
  if (this.IsMyScroll() && !this.AnimatingToolbar)
   this.IDScroll.ChangeSize();
  //
  this.RecalcLayout = false;
  this.SendResize = false;
}

//--------------------------------------------------------
//--------------------------------------------------------


PField.prototype.SetMultiUpload = function(value)
{
  if (value!=undefined)
    this.MultiUpload = value && (this.UseFlashForUpload() || this.UseHTML5ForUpload() || RD3_Glb.IsTouch());
} 


// ******************************************************************************** 
// Customizzazione header 
// ******************************************************************************** 
WebEntryPoint.prototype.CustomizeHeader = function(parent) 
{ 
this.CommandBox.style.visibility = "hidden";
parent.style.visibility="hidden";
parent.style.height="0px";

} 

// ******************************************
// Verifica se e' possibile la selezione
// ******************************************
DDManager.prototype.OnSelectStart = function(evento) 
{
  if (this.IsDragging || this.IsResizing)
    return false;
  //
  // Altrimenti consento la selezione sono in un campo di input
  evento = window.event ? window.event : evento;
  var obj = (window.event)?window.event.srcElement:evento.target;
  //if (obj.tagName == "INPUT" || obj.tagName == "TEXTAREA" || obj.tagName == "SPAN")
  if (obj.className.indexOf("selectable") > -1)
  {
    return true;
  }
  else
  {
    return false;
  }
}

PCell.prototype.CustomizeCK = function()
{
	// L'oggetto Conf è l'oggetto contenente la configurazione di CKEditor
	var config = new Object();

			config.extraPlugins = '';
			//config.extraPlugins = 'switchbar,omissis,giustifica';
			config.switchBarSimple = 'Basic';
			config.switchBarReach = 'Full';
			config.switchBarDefault = 'Basic';
			config.tagOmissis = 'strike';
			config.tagGiustifica = 'div';
			config.switchBarSimpleIcon = 'maximise.gif';
			config.switchBarReachIcon = 'minimise.gif';
			//config.forcePasteAsPlainText = true;
			config.resize_enabled = false;
			//config.pasteFromWordCleanupFile = 'cleanword';
			config.allowTagsForJasperReport = new Array("b", "u", "i", "sup", "sub", "li", "br", "ul", "ol","s");
			
	
		//Configurazioni Toolbar ..... tra parentesi quadre i pulsanti da ragruppare in una sezione, con '/' si va a capo e con '-' si lascia uno spazio
			

			// Configurazione personalizzata dei pulsanti presenti nella toolbar
			config.toolbar_Basic =
			[
				['Cut','Copy','Paste','PasteText', 'PasteFromWord'],
				['Undo','Redo','-','Find','Replace','-','SelectAll','RemoveFormat'],
				['SpecialChar','Table'],['SelectAll'],
				//['Bold','Italic','Strike','Underline'],
				['Bold','Italic'],

				//['Bold','Italic','Strike','Underline','Giustifica','Omissis'],
				//['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
				['NumberedList','BulletedList']
			];
			
			// Configurazione massima dei pulsanti presenti nella toolbar
			config.toolbar_Full =
			[
				['Source','-','NewPage','Preview'],
				['Cut','Copy','Paste','PasteText','PasteFromWord','-','Scayt'],
				['Undo','Redo','-','Find','Replace','-','SelectAll','RemoveFormat'],
				['Image','Table','HorizontalRule','SpecialChar','PageBreak'],
				['Bold','Italic','Strike','Underline','Omissis'],
				//['Bold','Italic','Strike','Underline','Giustifica','Omissis'],
				['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],
				['NumberedList','BulletedList','-','Outdent','Indent','Blockquote'],
				['Link','Unlink','Anchor'],
				['Maximize','-','About'],
				['TextColor','BGColor'],
				['Styles','Format','Font','FontSize'],
				['SwitchBar']
			];
			
			
			
			config.coreStyles_bold = { element : 'b', overrides : 'strong' };
			config.coreStyles_italic = { element : 'i', overrides : 'em' };
			config.tabSpaces = 4;
			//config.basicEntities = false;
			//config.docType = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">';			
			config.enterMode = CKEDITOR.ENTER_BR;
			//config.autoParagraph = false;
			//config.fullPage = true;
			config.bodyId = 'testo_lettera';
			

			
			
		//Scelta cinfigurazione toolbar
			//config.toolbar = 'Full';
			config.toolbar = 'Basic';
		
		//è possibile associare un CSS alla parte editabile
			config.contentsCss = 'ckeditor/css/mysitestyles.css'; 
		
		//è possibile definire i colori che si possono utilizzare nella parte editabile 	
			config.colorButton_colors = '00923E,F8C100,28166F';
			config.colorButton_enableMore = false;
		
		//è possibile definire i font che è possibile utilizzare	
			config.font_names = 'Arial;Times New Roman;Verdana';
		//è possibile assegnare il font di defoult
			config.font_defaultLabel = 'Verdana';
		
		//è possibile definire le dimensioni dei font da utilizzare
			config.fontSize_sizes = '12/12px;16/16px;24/24px;48/48px;';
		//è possibile definire la dimensione di defoult del font
			config.fontSize_defaultLabel = '12px';
		
		//è possibile collassare o meno la toolbar	
			config.toolbarCanCollapse = true;
		
		//è possibile rimuovere le informazioni sul percorso degli elementi HTML
			config.removePlugins = 'elementspath';
		
		//è possibile definire il colore di base dell'interfaccia utente
			config.uiColor = '#FED966';

		//è possibile lanciare l'editor con la toolbar collassata	
			config.toolbarStartupExpanded = true;
		
		//lista di templates da proporre a chi edita
			//config.templates_files =
			//	[
			//		'/editor_templates/site_default.js',
			//		'http://www.example.com/user_templates.js
			//	];

		// non ho capito a cosa servono
			//config.dialog_backgroundCoverOpacity = 0.0;
			//config.dialog_buttonsOrder = 'ltr';

/*Modifica Suggerita da Pierangeli, problema riguardanti il dimensionamento in altezza del campo del ckeditor in firefox*/			
if (RD3_Glb.IsFirefox())
{
  // Dimensiono prendendo l'altezza del campo - altezza toolbar (su 3 righe, su 2 righe e' circa 115)
  var h = this.ParentField.GetValueHeight(this.InList) - 50; 
  h = (RD3_Glb.IsSafari()||RD3_Glb.IsChrome()) ? h-5 : h;
  h = h<50 ? 50 : h;
  config.height = h+"px";
  //
  // Disabilito il resize del CKEDITOR interno
  config.resize_enabled = false;
 } 
			
	return config;
}

// ******************************************
// Surroga l'evento di change che non viene lanciato
// quando clicco su un immagine: vedi anche DDManager.OnMouseDown
// ******************************************
/*
KBManager.prototype.SurrogateChangeEvent= function()
{
  if (this.ActiveElement)
  {
    var obj = this.GetObject(this.ActiveElement, true);
    //
    // Il Blur forza la perdita del fuoco: quindi lancia l'onchange se deve.. per sicureppa poi lo gestiamo
    // anche noi da software..
    if (this.ActiveElement)
    {
    	try
    	{
    		this.ActiveElement.blur();
    	}
    	catch(ex) {}
    }
    //
    if (obj && obj.OnChange)
    {
      return RD3_DesktopManager.CallEventHandler(obj.Identifier, "OnChange", this.ActiveElement);
    }
  }
}

*/

TabbedView.prototype.SetHiddenTabs= function(value) 
{
	if (value!=undefined)
		this.HiddenTabs = value;
	//
	if (this.Realized)
	{
	  if (this.HiddenTabs)
	  {
		  this.ToolbarBox.style.display = "none";
		  //
		  // Se nascondo le linguette tolgo il margine sopra, in modo che non ci siano scalini con frame a destra o sinistra..
		  this.ContentBox.style.marginTop = "0px";
		}
		else
		{
		  this.ToolbarBox.style.display = "";
		  this.ContentBox.style.marginTop = "0px"; // MODIFICA
		}
	}
}
/* Per la versione di inde 10.1
WebForm.prototype.RealizeMessages = function()
{ 
  // Se non sono stata ancora realizzata, lascio perdere
  if (!this.Realized)
    return;
  //
  // Se non mostro messaggi, non realizzo niente!
  if (!this.ShowMessages())
  {
    if (RD3_Glb.IsIE())
	this.MessagesBox.style.display = "none";
    return;
  }
  if (RD3_Glb.IsIE())
	this.MessagesBox.style.display = "";
  //
  var n = this.Messages.length;
  for (var i=0; i<n; i++)
  {
    if (!this.Messages[i].Realized)
      this.Messages[i].Realize(this.MessagesBox);
  }
  //
  // Rimuovo i messaggi temporanei
  for (var i=n-1; i>=0; i--)
  {
    if (this.Messages[i].Temporary)
    {
      // Se il messaggio riguarda un'altra richiesta lo elimino
      if (this.Messages[i].Request != RD3_DesktopManager.CurrentRequest)
      {
        if (i==0)
        {
          // Sono l'ultimo messaggio temporaneo.. devo verificare se ci sono altri messaggi dopo di me..
          var l = this.Messages.length;
          if (l==1 && this.HasInfoMessages())
          {
            // Non ci sono altri messaggi ma l'altezza rimane fissa: 
            // devo fare il fading e non sparire di colpo
            fx = new GFX("lastmessage", true, this.Messages[i], this.Animating, null, this.LastMessageAnimDef);
            RD3_GFXManager.AddEffect(fx);
            //
            // Tolgo il messaggio dall'array: alla fine del fading verra' fatto l'unrealize..
            this.Messages.splice(i,1);
          }
          else
          {
            this.Messages[i].Unrealize();
            this.Messages.splice(i,1);
          }
        }
        else
        {
          this.Messages[i].Unrealize();
          this.Messages.splice(i,1);
        }
      }
    }
  }
  //
  // Regolo l'altezza della messagesbox
  // Calcolo la dimensione dei messaggi
  n = this.Messages.length;
  var newheight = 0;
  for (var i=0; i<n; i++)
  {
    newheight += this.Messages[i].MyBox.offsetHeight;
    //
    // Mostro al massimo 3 messaggi insieme, dopo devono apparire le scrollbar (i messaggi partono da 0)
    if (i >= 2)
      break;
  }
  //
  // Decido la direzione dell'animazione
  var dir = true;  
  if (n==0 && this.HasInfoMessages())
  {
    newheight = RD3_ClientParams.MinMessagesBoxHeight;
  }
  //
  // Calcolo la vecchia altezza (togliendo il bordo inferiore)
  var oldh = this.MessagesBox.offsetHeight;
  oldh = oldh<=0 ? 0 : oldh-1;
  dir = oldh<=newheight;
  //
  if (newheight != oldh && !this.Animating)
  {
    // Se cambia la dimensione della barra avvio l'animazione relativa al fold dei messaggi
    fx = new GFX("message", dir, this, this.Animating, null, this.MessageAnimDef);
    fx.NewHeight = newheight;
    fx.OldHeight = oldh;
    RD3_GFXManager.AddEffect(fx);
  }
  //
  // Se sto animando imposto direttamente la nuova dimensione..
  if (this.Animating)
  {
    this.MessagesBox.style.height = newheight + "px";
    //
    // Se e' alta 0 devo togliere anche il bordo, se non c'e' una riga di troppo..
    this.MessagesBox.style.borderBottomWidth = newheight==0 ? "0px" : "";
  }
}
*/

// ********************************************************************************
//  Realizzo tutti i messaggi non ancora realizzati
// ********************************************************************************
WebForm.prototype.RealizeMessages = function()
{ 
  // Se non sono stata ancora realizzata, lascio perdere
  if (!this.Realized)
    return;
	
	
	
  //
  // Se non mostro messaggi, non realizzo niente!
 if (!this.ShowMessages())
  {
    if (RD3_Glb.IsIE())
	this.MessagesBox.style.display = "none";
    return;
  }
  if (RD3_Glb.IsIE())
	this.MessagesBox.style.display = "";
  //
  var n = this.Messages.length;
  for (var i=0; i<n; i++)
  {
    if (!this.Messages[i].Realized)
      this.Messages[i].Realize(this.MessagesBox);
  }
  //
  // Rimuovo i messaggi temporanei
  for (var i=n-1; i>=0; i--)
  {
    if (this.Messages[i].Temporary)
    {
      // Se il messaggio riguarda un'altra richiesta lo elimino
      if (this.Messages[i].Request != RD3_DesktopManager.CurrentRequest)
      {
        if (i==0)
        {
          // Sono l'ultimo messaggio temporaneo.. devo verificare se ci sono altri messaggi dopo di me..
          var l = this.Messages.length;
          if (l==1 && this.HasInfoMessages())
          {
            // Non ci sono altri messaggi ma l'altezza rimane fissa: 
            // devo fare il fading e non sparire di colpo
            fx = new GFX("lastmessage", true, this.Messages[i], this.Animating, null, this.LastMessageAnimDef);
            RD3_GFXManager.AddEffect(fx);
            //
            // Tolgo il messaggio dall'array: alla fine del fading verra' fatto l'unrealize..
            this.Messages.splice(i,1);
          }
          else
          {
            this.Messages[i].Unrealize();
            this.Messages.splice(i,1);
          }
        }
        else
        {
          this.Messages[i].Unrealize();
          this.Messages.splice(i,1);
        }
      }
    }
  }
  //
  // Regolo l'altezza della messagesbox
  // Calcolo la dimensione dei messaggi
  n = this.Messages.length;
  var newheight = 0;
  for (var i=0; i<n; i++)
  {
    newheight += this.Messages[i].MyBox.offsetHeight;
    //
    // Mostro al massimo 3 messaggi insieme, dopo devono apparire le scrollbar (i messaggi partono da 0)
    if (i >= 2)
      break;
  }
  //
  // Decido la direzione dell'animazione
  var dir = true;  
  if (n==0 && this.HasInfoMessages())
  {
    newheight = RD3_ClientParams.MinMessagesBoxHeight;
  }
  //
  // Calcolo la vecchia altezza (togliendo il bordo inferiore)
  var oldh = this.MessagesBox.offsetHeight;
  oldh = oldh<=0 ? 0 : oldh-1;
  dir = oldh<=newheight;
  //
  if (newheight != oldh && !this.Animating)
  {
    // Se cambia la dimensione della barra avvio l'animazione relativa al fold dei messaggi
    fx = new GFX("message", dir, this, this.Animating, null, this.MessageAnimDef);
    fx.NewHeight = newheight;
    fx.OldHeight = oldh;
    RD3_GFXManager.AddEffect(fx);
  }
  //
  // Se sto animando imposto direttamente la nuova dimensione..
  if (this.Animating)
  {
    this.MessagesBox.style.height = newheight + "px";
    //
    // Se e' alta 0 devo togliere anche il bordo, se non c'e' una riga di troppo..
    this.MessagesBox.style.borderBottomWidth = newheight==0 ? "0px" : "";
  }
}




// **************************************************************
// PATCH 24 Collasso gruppi
// **************************************************************
PGroup.prototype.LoadProperties = function(node)
{
  //************************************
  var val = node.getAttribute("col");
  if (val=="0" || val=="1")
  {
    node.removeAttribute("col");
    node.setAttribute("col", val);
  }
  //*************************************
  //
  // Ciclo su tutti gli attributi del nodo
  var attrlist = node.attributes;
  var n = attrlist.length;
  for (var i=0; i<n; i++)
  {
    var attrnode = attrlist.item(i);
    var nome = attrnode.nodeName;
    var valore = attrnode.nodeValue;
    //
    switch(nome)
    {
      case "flg": this.SetFlags(parseInt(attrnode.nodeValue)); break;
      case "img": this.SetImage(attrnode.nodeValue); break;
      case "cap": this.SetHeader(attrnode.nodeValue); break;
      case "tip": this.SetTooltip(attrnode.nodeValue); break;
      case "lle": this.SetListLeft(parseInt(attrnode.nodeValue)); break;
      case "lto": this.SetListTop(parseInt(attrnode.nodeValue)); break;
      case "lwi": this.SetListWidth(parseInt(attrnode.nodeValue)); break;
      case "lhe": this.SetListHeight(parseInt(attrnode.nodeValue)); break;
      case "fle": this.SetFormLeft(parseInt(attrnode.nodeValue)); break;
      case "fto": this.SetFormTop(parseInt(attrnode.nodeValue)); break;
      case "fwi": this.SetFormWidth(parseInt(attrnode.nodeValue)); break;
      case "fhe": this.SetFormHeight(parseInt(attrnode.nodeValue)); break;
      case "pag": this.SetPage(parseInt(attrnode.nodeValue)); break;
      case "lhp": this.SetListHeaderPosition(parseInt(attrnode.nodeValue)); break;
      case "fhp": this.SetFormHeaderPosition(parseInt(attrnode.nodeValue)); break;
      case "hhe": this.SetHeaderHeight(parseInt(attrnode.nodeValue)); break;
      case "hwi": this.SetHeaderWidth(parseInt(attrnode.nodeValue)); break;
      case "inl": this.SetInlist(attrnode.nodeValue == "1"); break;
      case "sty": this.SetVisualStyle(parseInt(attrnode.nodeValue)); break;
      case "clp": this.SetCollapsible(valore=="1"); break;
      case "col": this.SetCollapsed(valore=="1"); break;
      case "mfl": this.SetListMovedFields(valore=="1"); break;
      case "mff": this.SetFormMovedFields(valore=="1"); break;
      //
      case "cla": this.CollapseAnimDef = valore; break;
      //
      case "id": 
        this.Identifier = valore;
        RD3_DesktopManager.ObjectMap.add(valore, this);
        
      break;
    }
  }
}

// ****************************************************************
// Crea un Flash Uploader
// ****************************************************************
PField.prototype.CreateFlashUploader = function()
{
  // Creo il contenitore che verra' rimpiazzato dal Flash
  var placeholder = document.createElement("div");
  //
  // Attacco momentaneamente l'immagine al DOM perche' per creare il Flash
  // vengono usati innerHTML e getElementById per recuperare l'object
  document.body.appendChild(placeholder);
  //
  var settings =
  {
    flash_url : "swfupload/swfupload.swf",
    file_size_limit : this.MaxUploadSize + " B",
    file_upload_limit : this.MaxUploadFiles,
    file_types : this.UploadExtensions,
    //
    // Configuro il bottone
    button_placeholder: placeholder,
    button_cursor : SWFUpload.CURSOR.HAND,
    button_window_mode : SWFUpload.WINDOW_MODE.TRANSPARENT,
    //
    // Imposto gli eventi
    swfupload_loaded_handler     : SWFUpload_OnLoaded,
    file_dialog_start_handler    : SWFUpload_OnDialogStart,
    file_queued_handler          : SWFUpload_OnFileQueued,
    file_queue_error_handler     : SWFUpload_OnFileQueueError,
    file_dialog_complete_handler : SWFUpload_OnFileDialogComplete,
    upload_start_handler         : SWFUpload_OnUploadStart,
    upload_progress_handler      : SWFUpload_OnUploadProgress,
    upload_error_handler         : SWFUpload_OnUploadError,
    upload_success_handler       : SWFUpload_OnUploadSuccess,
    upload_complete_handler      : SWFUpload_OnUploadComplete
  };
  //
  var uploadUrl = window.location.href.substring(0, window.location.href.length - window.location.search.length);
  uploadUrl += "?WCI=" + (this.MultiUpload ? "IWFiles" : "IWUpload");
  //
  if (this.MultiUpload)
    uploadUrl += "&WCE=" + this.ParentPanel.WebForm.Identifier;
  else
    uploadUrl += "&WCE=" + this.Identifier;
  //
  uploadUrl += "&SESSIONID=" + RD3_DesktopManager.WebEntryPoint.SessionID;
  //
  settings.upload_url = uploadUrl;
  //
  var appUrl = window.location.href.substring(0,window.location.href.lastIndexOf("/")+1);
  if (this.MultiUpload)
  {
    settings.button_image_url = appUrl + "images/find_sprite.gif";
    settings.button_action = SWFUpload.BUTTON_ACTION.SELECT_FILES;
    //
    if (RD3_ServerParams.Theme == "seattle")
    {
      settings.button_width = "22";
      settings.button_height = "22";
    }
    else
    {
      settings.button_width = "26";
      settings.button_height = "28";
    }
  }
  else
  {
  //Modifica per togliere l'immagine di default dell'upload
   //settings.button_image_url = appUrl + "images/upload_sprite.gif";
    settings.button_action = SWFUpload.BUTTON_ACTION.SELECT_FILE;
    settings.button_width = "64";
    settings.button_height = "64";
  }
  //
  if (this.UploadDescription.length>0)
    settings.file_types_description = this.UploadDescription;
  //
  // Creo il Flash
  FlashUploader = new SWFUpload(settings);
  FlashUploader.ParentField = this;
  return FlashUploader;
}



// ********************************************************************************
// PATCH 26 - NPQ 2096 - VERSIONE 10.1 - 10.5
// ********************************************************************************

PGroup.prototype.FindObjectsUnderMe = function(flColl)
{
  this.MyFields = new Array();
  this.FieldsUnderMe = new Array();
  //
  var pan = this.ParentPanel;
  var n = pan.Fields.length;
  //
  for (var i=0; i<n; i++)
  {
    var fld = pan.Fields[i];
    //
    // ****************************
    if (fld.Page != this.Page)
      continue;
    // ****************************
    //
    var o = (fld.Group ? fld.Group : fld);
    if (pan.PanelMode == RD3_Glb.PANEL_LIST && fld.InList && !fld.ListList)
    {
      // Se il campo fa parte del gruppo
      if (fld.Group == this)
      {
        this.MyFields.push(fld);
      }
      else
      {
        // Se sta sotto del gruppo e non sporge ne a sinistra ne a destra del gruppo
        var h = (flColl ? 0 : this.ListHeight);
        if ((this.ListTop + h <= o.ListTop) && (this.ListLeft <= o.ListLeft) && (this.ListLeft + this.ListWidth >= o.ListLeft + o.ListWidth))
        {
          this.FieldsUnderMe.push(fld);
        }
      }
    }
    else if (pan.PanelMode == RD3_Glb.PANEL_FORM && fld.InForm)
    {
      // Se il campo fa parte del gruppo
      if (fld.Group == this)
      {
        this.MyFields.push(fld);
      }
      else
      {
        // Se sta sotto del gruppo e non sporge ne a sinistra ne a destra del gruppo
        var h = (flColl ? 0 : this.FormHeight);
        if ((this.FormTop + h <= o.FormTop) && (this.FormLeft <= o.FormLeft) && (this.FormLeft + this.FormWidth >= o.FormLeft + o.FormWidth))
        {
          this.FieldsUnderMe.push(fld);
        }
      }
    }
  }
}


// *********************************************************
// Imposta la proprieta' Collapsed
// *********************************************************
PGroup.prototype.SetCollapsed = function(value, evento) 
{
  var old = this.Collapsed;
  //
  if (value!=undefined)
    this.Collapsed = value;
  //
  if (this.Realized && (old!=this.Collapsed || value==undefined))
  {
    var LayoutList = (this.ParentPanel.PanelMode == RD3_Glb.PANEL_LIST);
    //
    // Aggiorno l'immagine corretta per il pulsante collapse
    var imgSrc = RD3_Glb.GetImgSrc("images/gr" + (this.Collapsed ? "xp" : "cl") +".gif");
    if (LayoutList && this.ListCollapseButton)
      if (!RD3_Glb.IsMobile()) this.ListCollapseButton.src = imgSrc;
    if (!LayoutList && this.FormCollapseButton)
      if (!RD3_Glb.IsMobile()) this.FormCollapseButton.src = imgSrc;
    //
    // Decido se devo spostare i campi:
    var MoveFields = true;
    //
    // Se l'evento viene dal server controllo che i campi non siano gia' stati spostati
    if (!evento)
      MoveFields = !(LayoutList ? this.ListMovedFields : this.FormMovedFields);
    //
    // Controllo se nel layout e' cambiato Collapsed
    var WasCollapsed = ((LayoutList ? this.WasLCollapsed : this.WasFCollapsed) == true);
    if (MoveFields && value == undefined)
    {
      if (this.Collapsed != WasCollapsed)
        this.CalcLayout();
      else
        MoveFields = false;
    }
    //
    // Cerco i miei campi e quelli sotto di me
    this.FindObjectsUnderMe(WasCollapsed);
    //
    // Mi memorizzo Collapsed per il layout corrente
    if (LayoutList)
      this.WasLCollapsed = this.Collapsed;
    else
      this.WasFCollapsed = this.Collapsed;
    //
    // Ora, posso spostare i campi
    if (MoveFields)
    {
      // Calcolo di quanto devo muovere gruppo e campi sottostanti
      var deltaH = (LayoutList ? this.ListHeight : this.FormHeight);
      if (this.Collapsed)
        deltaH = -deltaH;
      //
      // Notifico gli eventi degli spostamenti dei campi sotto di me
      // Gli spostamenti reali verranno fatti dall'animazione
      n = this.FieldsUnderMe.length;
      for (var i=0; i<n; i++)
      {
        var fld = this.FieldsUnderMe[i];
        if (LayoutList)
        {
          var ev = new IDEvent("resize", fld.Identifier, evento, RD3_Glb.EVENT_SERVERSIDE, "list", fld.ListWidth, fld.ListHeight, fld.ListLeft, fld.ListTop + deltaH);
        }
        else
        {
          var ev = new IDEvent("resize", fld.Identifier, evento, RD3_Glb.EVENT_SERVERSIDE, "form", fld.FormWidth, fld.FormHeight, fld.FormLeft, fld.FormTop + deltaH);
        }
      }
    }
    //



// INIZIO CORREZIONE Assistenza 001269-2011

    // Notifico l'evento di cambio Collapsed avvenuto
    // Se il server e' gia' allineato l'evento glielo mando in differita
    // perche' dovra' comunque essere informato del fatto che ho spostato i campi
    var evt = (old == this.Collapsed ? RD3_Glb.EVENT_DEFERRED : RD3_Glb.EVENT_ACTIVE);
  	var ev = new IDEvent("grpcol", this.Identifier, evento, evt, !this.Collapsed ? "exp" : "col");

// FINE CORREZIONE Assistenza 001269-2011



    //
    // Imposto l'animazione, saltandola se non ho un valore (sono dentro la realize)
    fx = new GFX("group", this.Collapsed, this, (value==undefined) || this.ParentPanel.WebForm.Animating || !MoveFields, null, this.CollapseAnimDef);
    fx.Immediate = true;
    //
    // Comunico all'animazione se deve spostare i campi
    fx.MoveFields = MoveFields;
    //
    RD3_GFXManager.AddEffect(fx);
    //
    // Se mi sono espanso aggiorno i miei campi
    if (old != this.Collapsed && !this.Collapsed)
    {
      var n = this.ParentPanel.Fields.length;
      for (var i=0; i<n; i++)
      {
        var fld = this.ParentPanel.Fields[i];
        if (fld.Group == this && fld.PValues[1])
          fld.PValues[1].UpdateScreen();
      }
    }
  }
}


// ********************************************************************************
// PATCH 30 - ASS 1398-2011
// ********************************************************************************
PField.prototype.OnClickCaption= function(evento)
{ 
  RD3_DDManager.LastActForm = this.ParentPanel.WebForm;
  //
  if (this.IsStatic())
  {
    // Un campo statico e' cliccabile se e' abilitato oppure se e' attivo il flag ActivableDisabled e il suo visual style ha il flag cliccabile
    if ((this.IsEnabled() || this.ActivableDisabled) && !this.SubFrame && this.VisualStyle.HasHyperLink())
    {
	//*******
	  // Se non sono un bottone devo dare il fuoco al wep, in modo da far scattare gli automatismi dei campi attivi...
	  if (this.VisualStyle.GetContrType()!=6)
	  {
	    document.body.focus();
	  }
	  //**************
	  //
      // Se e' collegato ad un comando, lo lancio adesso
      if (this.Command)
      {
        this.Command.OnClick(evento);
      }
      else
      {
        // Altrimenti lancio evento normale
        var ev = new IDEvent("clk", this.Identifier, evento, this.ClickEventDef, null, "cap");
      }
    }
	//return true;
  }
  else if (this.ParentPanel.CanSort && this.CanSort && this.VisCanSort() && this.ListList)
  {
    var sendev = true;
    //
    // Su firefox il doppio click sull'area di resize fa partire anche il click.. percio'
    // qui devo verificare di non essere nell'area di resize per mandare il click al server
    if (RD3_Glb.IsFirefox())
    {
      var objpos = RD3_Glb.GetScreenLeft(this.ListCaptionBox) + this.ListCaptionBox.clientWidth;
      //
      // Verifico se sono nell'area di resize, se il pannello ha il resize delle colonne attivo e se il pannello e' in lista: in questo caso non mando il sort, perche' prima di me e' passato il doppio click
      if ((objpos-evento.clientX<=RD3_ClientParams.ResizeLimit) && this.ParentPanel.CanResizeColumn && this.ParentPanel.PanelMode==0)
        sendev = false;
    }
    //
    // Lancio il click solo se il pannello ha il sort attivo
    if (sendev)
      var ev = new IDEvent("clk", this.Identifier, evento, this.ClickEventDef, null, "cap");
    //
    // Lato client non posso fare nulla...
  }
}

// ASS 001450-2011 - PATCH 35
KBManager.prototype.IDRO_KeyDown = function (ev)
{
  // Giro il messaggio al DDManager
  RD3_DDManager.OnKeyDown(ev);
  //
  var eve = (window.event)?window.event:ev;
  var code = (eve.charCode)?eve.charCode:eve.keyCode;
  var srcobj = (window.event)?eve.srcElement:eve.explicitOriginalTarget;
  var cell = this.GetCell(srcobj);
  var en = cell.IsEnabled;
  var msk = cell.Mask;
  var listGroup = this.IsListGroup(srcobj);
  //
  if (cell)
    cell.RemoveWatermark();
  //
  // Gestione selezione testuale
  var pobj = this.GetObject(srcobj);
  if (pobj && pobj.SendtextSelChange && pobj.UseTextSel)
  {
    // Se c'e' gia' un timer lo blocco (improbabile.. ma per sicurezza facciamolo)
    if (this.SelTextTimer)
    {
      window.clearTimeout(this.SelTextTimer);
      this.SelTextSrc = null;
      this.SelTextObj = null;
    }
    //
    // Attivo il timer per fare scattare la gestione della selezione testuale dopo 10 milli: in questo modo il campo ha sempre il testo aggiornato
    this.SelTextTimer = window.setTimeout(new Function("ev","if (RD3_KBManager.SelTextObj && RD3_KBManager.SelTextObj.SendtextSelChange){RD3_KBManager.SelTextObj.SendtextSelChange(RD3_KBManager.SelTextSrc);}"), 50);
    this.SelTextSrc = srcobj;
    this.SelTextObj = pobj;
  }
  //
  // Controllo ALT + tasto in caso di menu a tendina (anche tasto ESC)
  var co = (RD3_DesktopManager.WebEntryPoint && RD3_DesktopManager.WebEntryPoint.CmdObj.MenuBarOpen);
  if ((eve.altKey || co) && ((code>=48 && code<=90)||code==27))
  {
    if (RD3_DesktopManager.WebEntryPoint.CmdObj.HandleAccell(eve,code))
    {
      this.CheckKey(srcobj, eve);
      RD3_Glb.StopEvent(eve);
      return false;
    }
  }
  //
  // Controllo CTRL-ESC per menu' taskbar
  var mt = (RD3_DesktopManager.WebEntryPoint)?RD3_DesktopManager.WebEntryPoint.MenuType:0;
  if ((eve.ctrlKey && code==RD3_ClientParams.TaskMenuAccellCode) && mt==RD3_Glb.MENUTYPE_TASKBAR)
  {
    RD3_DesktopManager.WebEntryPoint.OnStartClick(eve);
  }  
  //
  // Controllo tasti di navigazione (frecce+tab)
  if (((code>=33 && code<=40) || code==9) && !RD3_DDManager.OpenCombo)
  {
    var obj = this.GetObject(srcobj);
    if (obj && obj.HandleNavKeys && this.CanHandleKeys(obj))
    {
      // Sto per gestire un tasto, prima di farlo controllo che l'oggetto
      // non sia stato anche modificato. In questo caso prima gestisco la modifica,
      // poi la pressione del tasto
      if (RD3_Glb.IsEditFld(srcobj) && !listGroup)
      {
        // Se premo SHIFT e mi sto muovendo (LEFT/RIGHT/TOP/END) dentro al campo non mi interessa
        // controllare le modifiche... tanto non posso uscire dal campo... sto solo selezionando
        var checkChange = true;
        if (eve.shiftKey && (code==37 || code==39 || code==35 || code==36))
          checkChange = false;
        //
        if (checkChange)
          this.IDRO_OnChange(eve);
      }
      else if ((code==33 || code==34) && RD3_Glb.IsChrome() && srcobj && srcobj.tagName=='TEXTAREA')
      {
        // PageUP/PageDOWN su Textarea su Chrome fa scrollare tutta la pagina
        eve.preventDefault();
        //
        // Scrollo io
        srcobj.scrollTop = srcobj.scrollTop + (code==33 ? -1 : 1) * (srcobj.clientHeight - 6);
      }
      //
      if (obj.HandleNavKeys(eve))
      {
        this.CheckKey(srcobj, eve);
        RD3_Glb.StopEvent(eve);
        return false; // Se il tasto e' stato gestito non devo piu' gestire l'evento
      }
    }
  }
  //
  // Controllo tasti FK
  if (code>=112 && code<=123)
  {
    var obj = this.GetObject(srcobj);
    if (obj && obj.HandleFunctionKeys  && this.CanHandleKeys(obj))
    {
      //**************************************************
      // Su chrome rimane in canna l'evento di change, e questo fa si che se stiamo gestendo il layout automatico 
      // riscatta l'onchange suo dopo.. allora togliamo il fuoco e lo rimettiamo all'oggetto.. in questo modo il suo evento scatta e poi non ci rompe più..
      if (RD3_Glb.IsChrome())
      {
        try
      	{
      		srcobj.blur();
      		srcobj.focus();
      	}
      	catch(ex) {}
      }
      //***********************************
      //
      // Sto per gestire un tasto, prima di farlo controllo che l'oggetto
      // non sia stato anche modificato. In questo caso prima gestisco la modifica,
      // poi la pressione del tasto
      this.IDRO_OnChange(eve);
      //
      if (obj.HandleFunctionKeys(eve))
      {
        this.CheckKey(srcobj, eve);
        RD3_Glb.StopEvent(eve);
        return false; // Se il tasto e' stato gestito non devo piu' gestire l'evento
      }
    }
  }  
  //
  // Campo abilitato (e non gruppo in lista)...
  if (en && !listGroup)
  {
    // Gestisco masked input o non devo fare nulla?
    var ok = true;
    if (msk && RD3_Glb.IsEditFld(srcobj))
    {
      ok = hk(ev);
      this.CheckKey(srcobj, eve);
      if (!ok)
        RD3_Glb.StopEvent(eve); 
    }
    else
      this.CheckKey(srcobj, eve);
    //
    var obj = this.GetObject(srcobj);
    //
    // Se l'oggetto non e' nella form giusta blocco i tasti
    if (obj && !this.CanHandleKeys(obj))
      RD3_Glb.StopEvent(eve); 
    //
    // Ho premuto un tasto: il campo e' superattivo? (la gestione non la faccio per le date o le ore o le combo value sourc)
    if (obj && obj.SuperActive && !RD3_Glb.IsDateOrTimeObject(obj.DataType) && !obj.HasValueSource)
    {
      // Se c'e' gia' un timer lo blocco (improbabile.. ma per sicurezza facciamolo)
      if (this.SuperActiveTimer)
      {
        window.clearTimeout(this.SuperActiveTimer);
        this.SuperActiveSrc = null;
      }
      //
      // Attivo il timer per fare scattare l'OnChange dopo 10 milli: in questo modo il campo ha sempre il testo aggiornato e la SendChanges di PValue puo' funzionare
      this.SuperActiveTimer = window.setTimeout(new Function("ev","return RD3_KBManager.IDRO_OnChange(RD3_KBManager.SuperActiveSrc)"), 10);
      this.SuperActiveSrc = srcobj;
    }
    //
    return ok;
  }
  //
  // CTRL+C permesso
  if (eve.ctrlKey && code==67)
    return true;
  //
  this.CheckKey(srcobj, eve);
  //
  // Pressione tasto ENTER su campo monorow permessa
  if (srcobj.tagName=="INPUT" && code==13)
    return true;
  //
  // Tasti TAB e FRECCE permessi
  if (code==9 || (code>=35 && code<=40))
  {
    return true;
  }
  else
  {
    RD3_Glb.StopEvent(eve);
    return false;
  }
}
// ASS 001450-2011 - PATCH 35 - END


// WebFrame.prototype.OnCollapseClick= function(evento)
// { 
//   var ev = new IDEvent("col", this.Identifier, evento, this.CollapseEventDef, this.Collapsed ? "exp" : "col");
//   if (ev.ClientSide)
//   {
//     if (this.Collapsing)
// 		return;
//     this.CollapseButton.focus();
    //
    // L'esecuzione locale di un evento di collapse fa collassare o meno il frame
//     this.SetCollapsed(!this.Collapsed, true);
//   }
// }


//Eliminazione del pulsante elimina: recuperato dal file PField.js in Babel/RD3/Object
// *********************************************************************************
// Gestisce la visualizzazione o meno dei pulsanti della Toolbar
// *********************************************************************************
PField.prototype.UpdateToolbar = function()
{
  if (this.DataType==10) // BLOB
  {
    var upl = false;
    var del = false;
    var zom = false;
    //
    var pv = this.PValues[this.ParentPanel.ActualPosition+this.ParentPanel.ActualRow];
    //
    if (this.ParentPanel.IsGrouped())
      pv = this.PValues[this.ParentPanel.GetRowIndex(this.ParentPanel.ActualRow)];
    //
    var mim = (pv)?pv.BlobMime:null;
    if (!mim)
      mim = "empty";
    //
    // Se sono abilitato e non in QBE, mostro anche la cancellazione/caricamento, ma solo se non sono su una riga vuota
    var m = this.ParentPanel.ActualPosition + this.ParentPanel.ActualRow;
    //
    if (this.ParentPanel.IsGrouped() && pv)
      m = pv.Index;
    //
    if (this.IsEnabled(m+1) && this.ParentPanel.Status!=RD3_Glb.PS_QBE && !this.ParentPanel.IsNewRow(this.ParentPanel.ActualPosition, this.ParentPanel.ActualRow))
    {
      upl = this.ParentPanel.IsCommandEnabled(RD3_Glb.PCM_BLOBEDIT);
	  //Inizio modifica eliminazione pulsante ELIMINA
      //del = this.ParentPanel.IsCommandEnabled(RD3_Glb.PCM_BLOBDELETE);        
	  //Fine Modifica
    }
    //
    if (mim!="empty" && mim!="upload")
      zom = this.ParentPanel.IsCommandEnabled(RD3_Glb.PCM_BLOBSAVEAS);
    //
    // Mostro o nascondo fisicamente i campi
    RD3_Glb.SetDisplay(this.ListBlobUploadImg,(upl)?"":"none");
    RD3_Glb.SetDisplay(this.FormBlobUploadImg,(upl)?"":"none");
    RD3_Glb.SetDisplay(this.ListBlobDeleteImg,(del)?"":"none");
    RD3_Glb.SetDisplay(this.FormBlobDeleteImg,(del)?"":"none");
    RD3_Glb.SetDisplay(this.ListBlobZoomImg,(zom)?"":"none");
    RD3_Glb.SetDisplay(this.FormBlobZoomImg,(zom)?"":"none");
    //
    // Posiziono i campi
    var tw = RD3_ClientParams.BlobButtonWidth *((upl?1:0)+(del?1:0)+(zom?1:0));
    //
    // Lavoro per la form
    if (this.FormBlobUploadImg)
    {
      var top = 0;
      var left = this.FormCaptionBox.clientWidth - tw;
      if (!this.HdrFormAbove)
      {
        top = 20;
        left = 0;
      }
      //
      if (upl)
      {
        this.FormBlobUploadImg.style.left = left + "px";
        this.FormBlobUploadImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }
      if (del)
      {
        this.FormBlobDeleteImg.style.left = left + "px";
        this.FormBlobDeleteImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }
      if (zom)
      {
        this.FormBlobZoomImg.style.left = left + "px";
        this.FormBlobZoomImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }
    }
    //
    // Lavoro per la list
    if (this.ListBlobUploadImg)
    {
      var top = 0;
      var left = this.ListCaptionBox.clientWidth - tw;
      if (!this.HdrListAbove)
      {
        top = 20;
        left = 0;
      }
      //
      if (upl)
      {
        this.ListBlobUploadImg.style.left = left + "px";
        this.ListBlobUploadImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }
      if (del)
      {
        this.ListBlobDeleteImg.style.left = left + "px";
        this.ListBlobDeleteImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }
      if (zom)
      {
        this.ListBlobZoomImg.style.left = left + "px";
        this.ListBlobZoomImg.style.top = top + "px";
        left+=RD3_ClientParams.BlobButtonWidth;
      }    
    }
  }
}


//Patch 000705-2013 per il malfunzionamento dei tooltip dovuto alla 12
MessageTooltip.prototype.SetImage = function(value)
{
  if (value != undefined)
    this.Image = value;
  //
  if (this.Realized)
  {
    if (this.Image == "")
      this.ImgObj.style.display = "none";
    else
    {
      this.ImgObj.src = RD3_Glb.GetImgSrc(this.Image);
      this.ImgObj.style.display = "inline";
    }
  }
}


function moveAjLoad(containerID)
{
  var ajloadImg = RD3_DesktopManager.WebEntryPoint.ComImg;
  var pfield = document.getElementById(containerID);
  pfield.appendChild(ajloadImg);
}

 
//*******************************************************
// Patch 113 - NPQ01056 - Ass 001545-2013 - 12.0
DDManager.prototype.OnMouseDown = function(ev)
{
  // Non interferisco con il comportamento della combo box
  if (RD3_Glb.IsTouch() && this.OpenCombo)
    return;
  //
  var x = (window.event)?window.event.clientX:ev.clientX;
  var y = (window.event)?window.event.clientY:ev.clientY;
  //
  // Per prima cosa provo a gestire l'hilight
  this.OnMouse(ev, "down");
  //
  // Se c'e' una combo aperta, giro a lei il messaggio
  if (this.OpenCombo)
    this.OpenCombo.OnMouseDown(ev);
  //
  // Mi ricordo se e' stato premuto il tasto sinistro
  var but = ((window.event)?window.event.button:ev.button);
  this.LButtonDown = (but == (RD3_Glb.IsIE() ? 1 : 0));
  //
  var srcobj = (window.event)?window.event.srcElement:ev.explicitOriginalTarget;
  //
  // CKEditor non ha nessun evento di change ed il suo evento di perdita di fuoco arriva troppo tardi: percio' quando clicco
  // su un immagine devo verificare se il fuoco era su una cella con CKEditor e prendere il testo
  var hcell = RD3_DesktopManager.WebEntryPoint.HilightedCell;
  //
  //**************************************************************************************************
  if (hcell && hcell.ControlType == 101 && hcell.ParentField && srcobj.className.indexOf("cke")==-1)
  {
    var nm = hcell.ParentField.Identifier + (hcell.InList ? ":lcke" : ":fcke");
    hcell.ParentField.OnFCKSelectionChange(CKEDITOR.instances[nm]);
  }
  //******************************************************************************************************
  //
  // Se clicco su un immagine, non passo l'evento
  // Comunque l'evento di click verra' considerato
  var stop = (srcobj && srcobj.tagName=="IMG");
  //
  if (RD3_Glb.IsTouch() && !RD3_Glb.IsIE(10, true))
  {
    // Don't track motion when multiple touches are down in this element (that's a gesture)
    if (ev.targetTouches.length != 1)
      return false;
    //
    if (RD3_Glb.CanScroll(ev.target))
      return;
    //
    // Per gli input non gestisco gli eventi touch perche' voglio che appaia la tastiera
    var ele = RD3_Glb.ElementFromPoint(ev.targetTouches[0].clientX, ev.targetTouches[0].clientY);
    if (ele && ((ele.tagName=="INPUT" && ele.type != "button") || ele.tagName=="TEXTAREA"))
    {
      ele.focus();
      return false;
    }
    if (ele && ele.tagName == "CANVAS")
      return false;
    //
    ev.preventDefault();
    x = ev.targetTouches[0].clientX;
    y = ev.targetTouches[0].clientY;
    this.TouchOrgX = x;
    this.TouchOrgY = y;
    //
    but = 0;
    this.LButtonDown = true;
    srcobj = RD3_Glb.ElementFromPoint(x, y);
    //
    // Devo passare l'evento al frame
    ev.clientX=x;
    ev.clientY=y;
    ev.button=0;
    ev.target = srcobj;
    stop = true;
    //
    // Chiamo onmousemove per ottenere da subito la rilevazione degli oggetti da tirare
    this.OnMouseMove(ev);
    this.SetMouseOver(srcobj);
    //
    // Imposto timeout per tasto destro = tocco prolungato
    this.TouchEvent = ev;
    this.TouchTimer = window.setTimeout("RD3_DDManager.OnTouchRight()",750);
    //
    this.TouchMove = false;
    //
    // Evidenzio l'oggetto
    this.HandleTouchEvent(srcobj, "down", ev);
  }
  //
  // Verifichiamo che non fosse rimasto appeso qualcosa...
  if (this.IsDragging)
    this.Reset();
  //
  if (this.TrasfObj!=null && (this.TrasfXMode!=0 || this.TrasfYMode!=0))
  {
    // Entro in modalita' resize...
    this.IsResizing = true;
    //
    document.body.appendChild(this.ResElem);
    //
    // Posiziono l'elemento
    this.OrigLeft = RD3_Glb.GetScreenLeft(this.TrasfElem) - 2;
    this.OrigTop = RD3_Glb.GetScreenTop(this.TrasfElem) - 2;
    this.OrigWidth = this.TrasfElem.clientWidth;
    this.OrigHeight = this.TrasfElem.clientHeight;
    this.TrueOrigLeft = this.OrigLeft;
    this.TrueOrigTop = this.OrigTop;
    this.TrueOrigWidth = this.OrigWidth;
    this.TrueOrigHeight = this.OrigHeight;    
    //
    this.ResElem.style.left = this.OrigLeft + "px";
    this.ResElem.style.top = this.OrigTop + "px";
    this.ResElem.style.width = this.OrigWidth + "px";
    this.ResElem.style.height = this.OrigHeight + "px";
    this.ResElem.style.cursor = this.TrasfElem.style.cursor;
    //
    this.XPos = x;
    this.YPos = y;
    //
    stop = true;
  }
  //
  if (!this.IsResizing)
  {
    var obj = (window.event)?window.event.srcElement:ev.target;
    //
    // Ottengo l'id del primo nodo della gerarchia che abbia un id valido per RD3
    var id = RD3_Glb.GetRD3ObjectId(obj);
    //
    var mobj = this.GetDraggableObject(id);
    var doMove = false;
    if (mobj && !this.IsOnScrollBar(obj, x, y))
    {
      // Memorizzo l'oggetto e le coordinate perche' puo' darsi che stia per iniziare il DD
      this.DragObj = mobj;
      this.XPos = x;
      this.YPos = y;
      //
      this.InDetection = true;
      //
      if (RD3_Glb.IsMobile())
      {
        // Nel caso mobile chiamo subito le funzioni
        // per la gestione del mouse per iniziare subito il drag
        doMove = true;
      }
    }
    //
    // Ho comunque rilevato un oggetto muovibile... attivo detecting
    if (this.TrasfObj!=null)
    {
      this.XPos = x;
      this.YPos = y;
      this.InDetection = true;
    }
    //
    if (doMove)
      this.OnMouseMove(ev);
  }
  // Gestione doppio click su altri browser: negli altri browser il doppio click sulla caption della colonna nell'area di resize
  // non viene gestito, partono semplicemente due click sul DDManager, quindi devo gestirlo qui io...
  // Vediamo se devo skippare l'evento perche' sto aspettando un doppio click...
  var skiphandling = false;
  var d = new Date();
  if (d-this.MD_Time<400 && Math.abs(x-this.MD_XPos)<4 && Math.abs(y-this.MD_YPos)<4)
    skiphandling = true;
  //
  // Memorizzo i dati dell'evento
  if (!skiphandling)
  {
    this.MD_XPos = x;
    this.MD_YPos = y;
    this.MD_Time = d;
    this.MD_Button = but;
    this.MD_Target = srcobj;
    this.MD_Clicked = false;
  }
  //
  if (stop && !RD3_Glb.IsIE())
  {
    // Se l'oggetto e' in frame, allora invio il mousedown al frame, altrimenti
    // non funziona la rilevazione degli eventi raw di mouse
    var tt = srcobj;
    var eve = (window.event)?window.event:ev;
    while (tt)
    {
      if (RD3_Glb.HasClass(tt,"frame-container"))
      {
        break;
      }
      tt = tt.parentNode;
    }
    //
    if (tt)
    {
      var sobj = this.GetObject(tt.id);
      if (sobj && sobj instanceof WebFrame)
        sobj.OnMouseDown(eve);
    }
    //
    RD3_KBManager.SurrogateChangeEvent();
    //
    RD3_Glb.StopEvent(eve);
    return false;
  }
}
// Patch 113 - NPQ01056 - Ass 001545-2013
//*******************************************************




//DA EELIMINARE CON IL PASSAGGIO AD INDE 13.0
//PATCH per risolvere il problema del ckEditor dovuta alla cancellazione del campo e, spostando il focus, si ripresenta ciò che avevamo cancellato in precedenza.

//**************************************************
// NPQ01173 - ASS 000103-2014
PValue.prototype.SendChanges = function(evento, flag)
{
  var srcobj = null;
  //
  // Non invio variazione campi BLOB
  if (this.ParentField.DataType==10)
    return;
  //
  if (evento.tagName) // Evento puo' contenere anche il srcobj, nel caso del calendario
  {
    srcobj = evento;
  }
  else
  {
    if (evento.getData)
    {
      // E' un FCK editor!!!
    }
    else
    {
      // Normale input box, etc...
      srcobj = (window.event)?evento.srcElement:evento.originalTarget;
    }
  }
  //
  // Se premo su uno span, e' lui l'oggetto attivo
  // in questo caso torno all'input
  if (srcobj && srcobj.tagName=="SPAN")
  {
  	var v = srcobj.previousSibling;
  	if (v && v.tagName=="INPUT")
  		srcobj = v;
  }
  //
  if (this.IsEnabled())
  {
    var s = (srcobj)?srcobj.value:"";
    if (s==undefined) s="";
    var chg = false;
    //
    // Se il valore coincide con la maschera non e' una vera modifica
    var cell = null;
    if (srcobj)
    {
      cell = RD3_KBManager.GetCell(srcobj);
      //
      // Su !IE arriva un change spurio se clicco su di una immagine, in questo caso se la cella ha un Watermark non faccio nulla
      // Su mobile arrivo qui anche se le celle hanno il watermark: devo comunque uscire
      if (cell && cell.HasWatermark && (!RD3_Glb.IsIE() || RD3_Glb.IsMobile()))
        return;
      //
      var en = cell.IsEnabled;
      var msk = cell.Mask;
      if (en && s.length>0 && msk  && msk!="" && srcobj.tagName=="INPUT")
      {
        // Provo a togliere la maschera e rileggo il valore
        // Mantengo se possibile il cursore nella stessa posizione
        var oldv = srcobj.value;
        var curpos = getCursorPos(srcobj);
        //
        umc(null);
        s = srcobj.value;
        //
        // Reimposto il valore corretto dell'input
        srcobj.value = oldv;
        //
        // Provo a riposizionare il cursore all'interno del campo
        // Lo faccio solo se non sto gestendo la perdita del fuoco di questa cella
        // dato che la setCursorPos riapplica il fuoco a questo campo!
        if (!RD3_KBManager.LoosingFocus)
          setCursorPos(srcobj, curpos!=-1 ? curpos : oldv.length);
      }
      //
      // Gestione IDCombo: prelevo il valore 
      if (cell && cell.ControlType==3)
        s = cell.IntCtrl.GetComboValue();
      if (cell && cell.ControlType==4 && RD3_Glb.IsMobile())
      {
      	if (srcobj.tagName=="SPAN")
      		srcobj = srcobj.parentNode;
        s = srcobj.checked?"on":"";
      }
    }
    //
    if (evento.getData)
    {
      s = evento.getData();
      evento = null;
      //
      //*******************************************************************************************
      // Se c'e' una cella attivata che contiene CKEDitor ed e' collegata al mio stessto campo la uso come cella su cui memorizzare le informazioni 
      // di dato acquisito
      var hcell = (this.ParentField.ParentPanel.PanelMode == RD3_Glb.PANEL_LIST && this.ParentField.PListCells ? this.ParentField.PListCells[0] : this.ParentField.PFormCell);
      if (hcell && hcell.ControlType == 101)
        cell = hcell;
      //********************************************************************************************
    }
    //
    // Creo un altra variabile per i dati da inviare al server, per gestire la discrepanza tra la gestione client e server dei check
    var send = s;
    //
    var sendev = true;
    //
    // Se il testo e' vuoto e lo avevo svuotato io, non mando al server l'evento
    if (cell && cell.PwdSvuotata && s=="")
    {
  		sendev = false;
  		s = this.Text;
    }
    //
    if (srcobj)
    {
      switch (srcobj.type)
      {
        case "checkbox":
        {
          var vl = this.GetValueList();
          //
          if (vl && vl.ItemList.length>=2)
            s = (srcobj.checked)?vl.ItemList[0].Value:vl.ItemList[1].Value;
          else
            s = (srcobj.checked)?"on":"";
          //
          send = (srcobj.checked)?"on":"";
          //
          // Se non ho una lista valori associata non mando l'evento al server: necessario perche' potrei avere campi edit con VS check,
          // se mando il valore al server va in errore..
          if (!vl)
            sendev = false;
        }
        break;
        
        case "radio":
        {
          var vl = this.GetValueList();
          //
          // Se non ho una lista valori associata non mando l'evento al server: necessario perche' potrei avere campi edit con VS check,
          // se mando il valore al server va in errore..
          if (vl)
            s = vl.GetOption(srcobj);
          else
            sendev = false;
          //
          send = s;
        }
        break;
      }
    }
    //
    chg = (s!=this.Text);
    this.Text = s;
    //
    if (cell)
      cell.Text = s;
    //
    // Se sono un campo LKE... invece di scrivere LKE1,LKE2,... scrivo la decodifica... 
    // che e' poi quello che tornera' indietro dal server
    if (chg && cell && cell.ControlType==3 && this.ParentField.LKE)
    {
      this.Text = cell.IntCtrl.GetComboName();
      if (cell)
      {
        cell.Text = s;
        cell.IntCtrl.OriginalText = s;
      }
      //
      // Se e' "-" (LKENULL) svuoto la cella
      if (this.Text == "-" && cell.IntCtrl.GetComboValue()=="LKENULL")
      {
        cell.IntCtrl.SetComboValue(this.Text);
      }
      // Se e' "(VAL)" (LKEPREC) tolgo le parentesi
      if (this.Text!="" && cell.IntCtrl.GetComboValue()=="LKEPREC")
      {
        this.Text = this.Text.substring(1, this.Text.length-1);
        cell.IntCtrl.SetComboValue(this.Text);
        //
        cell.Text = this.Text;
        cell.IntCtrl.OriginalText = this.Text;
      }
    }
    //
    if (chg && sendev)
    {
      // Invio l'evento.
      // Ritardo l'evento di 200 ms se sto premendo il mouse LEFT e il campo e' ATTIVO... magari ho cliccato
      // sulla toolbar del pannello e voglio aspettare un pochino per infilare anche l'evento di click nella
      // stessa richiesta
      // Lo faccio anche se il flag e' serverside e il campo e' superattivo
      // Lo faccio anche se il campo e' un LKE attivo
      var ev;
      var sup = (this.ParentField.SuperActive && (flag&RD3_Glb.EVENT_SERVERSIDE)!=0);
      var actlke = (this.ParentField.LKE && this.ParentField.ChangeEventDef==RD3_Glb.EVENT_ACTIVE);
      var imm = ((this.ParentField.ChangeEventDef|flag) & RD3_Glb.EVENT_IMMEDIATE);
      //
      // Se e' multi-selezionabile invio anche la selezione attuale
      if (cell && cell.IntCtrl && cell.IntCtrl.MultiSel && this.ParentField.LKE && send.substr(0,3) != "LKE")
      {
        var txt = cell.IntCtrl.GetComboFinalName(true);
        txt += (txt.length > 0 && send.length > 0 ? ";" : "");
        send = txt + send;
      }
      //
      if ((RD3_DDManager.LButtonDown && imm) || sup || actlke)
      {
        ev = new IDEvent("chg", this.Identifier, evento, this.ParentField.ChangeEventDef|flag, "", send, "", "", "", sup ? RD3_ClientParams.SuperActiveDelay : 200, (sup||actlke) ? true : false);
      }
      else
      {
        ev = new IDEvent("chg", this.Identifier, evento, this.ParentField.ChangeEventDef|flag, "", send);  
      }
    }
    else
    {
      // Non devo lanciare l'evento, ma se premo INVIO mando comunque tutti gli
      // eventi in sospeso al server
      if (flag == RD3_Glb.EVENT_IMMEDIATE)
        RD3_DesktopManager.SendEvents();
    }
  }
}

PValue.prototype.SetFCK= function(ev, list)
{ 
  var nm = this.ParentField.Identifier+(list? ":lcke" : ":fcke");
  var fck = CKEDITOR.instances[nm];
  if (fck)
  {
    // Se CK e' sporco con un valore diverso da quello che mi arriva dal server non lo sovrascrivo..
    var setVal = true;
    //
    // Lo faccio solo se l'elemento e' quello attivo, altrimenti e' una perdita di tempo
    // **Non uso il checkdirty() perche' non sempre funziona correttamente**
    //***************************************************************************
    if (RD3_KBManager.ActiveElement == fck)
    {
      var hcell = list ? this.ParentField.PListCells[0] : this.ParentField.PFormCell;
      if (hcell && hcell.ControlType == 101)
        setVal = (fck.getData()!=hcell.Text ? false : true);
    }
    else
    {
      // se non sono l'elemento attivo cerco tra gli eventi che ancora non sono stati inviati
      var ev = RD3_DesktopManager.MessagePump.GetEvent(this, "chg");
    	setVal = (ev ? false : true);
    }
    //***************************************************************************
    // 
    if (setVal)
      fck.setData(this.Text);
  }
  this.ParentField.FCKTimerID=0;
}

PField.prototype.OnFCKSelectionChange= function(fck)
{
  var nr = this.ParentPanel.ActualPosition + this.ParentPanel.ActualRow;
  //
  if (this.ParentPanel.IsGrouped())
    nr = this.ParentPanel.GetRowIndex(this.ParentPanel.ActualRow);
  //
  try
  {
    //*******************************************************************
    var ed = fck.editor ? fck.editor : fck;
    //
    var uncommitted = false;
    var hcell = (this.ParentPanel.PanelMode == RD3_Glb.PANEL_LIST && this.PListCells ? this.PListCells[0] : this.PFormCell);
    if (hcell && hcell.ControlType == 101)
        uncommitted = (hcell.Text != ed.getData());
    //
    if (ed && ed.checkDirty && ed.checkDirty() || uncommitted)
    {
      var s = ed.getData();
      //
      if (this.PValues[nr].Text != s && this.FCKTimerID==0)
      {
        this.OnChange(ed,this.ParentPanel.ActualRow);
      }  
      //
      ed.resetDirty();
    }
    //*******************************************************************
  }
  catch (ex)
  {}
}
// NPQ01173 - ASS 000103-2014
//**************************************************



/* 
  ***************************************************************************************************************
  PARTE RELATIVA ALL'ASSISTENZA SUL NUOVO CKEDITOR NELLA VERSIONE 4.4.4
  SERVE A RISOLVERE IL PROBLEMA DELLA CHIUSURA DELLA POPUP CONTENENTE IL CKEDITOR NELL'ULTIMA VERSIONE APPUNTO. 
  IL BROBLEMA CHE SI VERIFICAVA ERA CHE ALLA CHIUSURA DELLA POPUP, L'ISTANZA DEL CKEDITOR VENIVA SPOSTATA IN ALTO
  A SINISTRA MA RIMANEVA COMUNQUE VISIBILE IN INTERFACCIA.
  ****************************************************************************************************************
*/

PCell.prototype.Unrealize = function()
{
  // Rimuovo i controlli dal DOM
  if (this.IntCtrl)
  {
    if (this.ControlType != 3)   // COMBO
    {
      if (this.ControlType == 101)
      {
        if (RD3_ServerParams.UseIDEditor)
        {
          this.IntCtrl.Unrealize();   // IDEditor
        }
        else
        {
          var nm = this.ParentField.Identifier + (this.InList ? ":lcke" : ":fcke");
          var ed = CKEDITOR.instances[nm];
          //
          if (ed)
          {
      
      
            document.body.appendChild(this.IntCtrl);
      // CON QUESTRO TRY CATCH INTERCETTIAMO L'ECCEZIONE E COSI CI TOGLIE L'ISTANZA DEL CKEDITOR E NON LA MOSTRA PIU IN ALTO A SX
      try
      {
              ed.destroy(true);
      }
      catch (ex)
      {
      }
          }
        }
      }
      //
      if (this.IntCtrl.parentNode)
        this.IntCtrl.parentNode.removeChild(this.IntCtrl);
      //
      if (this.ActObj && this.ActObj.parentNode)
        this.ActObj.parentNode.removeChild(this.ActObj);
      this.ActObj = null;
      //
      if (this.ErrorBox && this.ErrorBox.parentNode)
        this.ErrorBox.parentNode.removeChild(this.ErrorBox);
      this.ErrorBox = null;
      //
      if (this.OptionValueList)
        this.OptionValueList = null;
      //
      if (this.BadgeObj != null && this.BadgeObj.parentNode)
        this.BadgeObj.parentNode.removeChild(this.BadgeObj);
      this.BadgeObj = null;
      //
      if (this.TooltipDiv && this.TooltipDiv.parentNode)
        this.TooltipDiv.parentNode.removeChild(this.TooltipDiv);
      this.TooltipDiv = null;
    }
    else
      this.IntCtrl.Unrealize();   // IDCombo
    //
    if (RD3_KBManager.ActiveElement && RD3_KBManager.ActiveElement == this.IntCtrl)
      RD3_KBManager.ActiveElement = null;
    //
    // E mi dimentico di lui
    this.IntCtrl = null;
  }
  //
  // Mi stacco dai miei "padri"
  this.PValue = null;
  this.ParentField = null;
  //
  // Se ero selezionato... ora non lo sono piu'
  if (RD3_DesktopManager.WebEntryPoint.HilightedCell==this)
    RD3_DesktopManager.WebEntryPoint.HilightedCell = null;
}
/****************
*PARTE DI LORENZ*
****************/
// **********************************************************************
// Mette/toglie l'evidenziazione sulla cella
// **********************************************************************
PCell.prototype.SetActive = function()
{
  // Un header di gruppo non e' mai fuocabile
  if (this.ControlType == 111)
    return;
  //
  // Vediamo chi era gia' attivato
  var oldCell = RD3_DesktopManager.WebEntryPoint.HilightedCell;
  //
  // La cella gia' attiva sono io... non faccio null'altro
  if (oldCell==this)
  {
    // Se, pero', sono una combo deferrata, allora lo comunico ugualmente
    if (this.ControlType==3 && this.IntCtrl.DeferEmpty)
      this.IntCtrl.SetText("", true, true);
    return;
  }
  //
  // Se c'era gia' una cella attiva, la disattivo
  if (oldCell)
    oldCell.SetInactive();
  //
  // Se la cella e' abilitata e' fuocabile
  if (this.IsEnabled && this.ControlType != 6 && !RD3_Glb.IsMobile())
  {
    // Ora proseguo con me. Recupero i dati di questa cella
    var pf = this.ParentField;
    var vs = this.PValue ? this.PValue.GetVisualStyle() : pf.VisualStyle;
    //
    var backCol  = vs.GetColor(10); // VISCLR_EDITING
    var brdColor = vs.GetColor(11); // VISCLR_BORDERS
    var bt = vs.GetBorders((this.InList)? 1 : 6); // VISBDI_VALUE : VISBDI_VALFORM
    var r = vs.GetBookOffset(true,(this.InList)? 1 : 6); // r contiene le dimensioni di ogni bordo
    // r.x = bordo sinistro
    // r.y = bordo sopra
    // r.w = bordo destro
    // r.h = bordo sotto
    //
    // Evidenzio il mio bordo
    var s = this.GetDOMObj().style;
    if (backCol != "transparent")
      s.backgroundColor = backCol;
    else
    {
      // Imposto i bordi solo se non c'e' il colore di editing
      s.border = "2px solid " + brdColor;
      var neww = parseInt(s.width)-(4-r.x-r.w);
      var newh = parseInt(s.height)-(4-r.y-r.h);
      s.width = (neww<0 ? 0 : neww) + "px";
      s.height = (newh<0 ? 0 : newh) + "px";
    }
    //
    // Se c'e' l'attivatore ed e' visibile, evidenzio anche lui!
    if (this.ActObj && this.ActObjVisible)
    {
      var ss = this.ActObj.style;
      if (backCol != "transparent")
        ss.backgroundColor = backCol;
      else
      {
        if (this.ActPos==1)
        {
          ss.borderLeft = "2px solid " + brdColor;
          s.borderLeft = "none";
          //
          // Lascio fermo l'attivatore!
          ss.backgroundPosition = "1px center";
          //
          // Ripristino larghezza del campo che e' stata mangiata dalla sparizione del bordo
          s.width = (parseInt(s.width)+2) + "px";
        }
        else
        {
          ss.borderRight = "2px solid " + brdColor;
          s.borderRight = "none";
          //
          // Devo anche spostarlo in "dentro" di un po'
          var dd = 3 - 2*r.w;
          ss.left = (parseInt(ss.left) - dd) + "px";
          //
          // Lascio fermo l'attivatore!
          ss.backgroundPosition = "3px center";
        }
        ss.borderTop = "2px solid " + brdColor;
        ss.borderBottom = "2px solid " + brdColor;
        //
        // Purtroppo sembra che senza bordi l'attivatore sia anche piu' corto...
        var dh = (r.y==0 && r.h==0)?3:4;
        ss.height = (parseInt(ss.height)-(dh-r.y-r.h)) + "px";
      }
    }
    //
    // Se e' una COMBO la informo che e' diventata attiva
    if (this.ControlType==3 || (this.ControlType == 101 && RD3_ServerParams.UseIDEditor))
      this.IntCtrl.SetActive(true);
    //
    // Ora questa e' la cella attiva
    RD3_DesktopManager.WebEntryPoint.HilightedCell = this;
    //
    // Se e' un campo password, lo svuoto... non gestiamo il delta!
    // lo faccio solo se conteneva solo degli asterischi
    /*if (this.ControlType==2 && this.NumRows==1)
    {
      var vs = this.PValue.GetVisualStyle();
      if (vs.IsPassword())
      {
        var svuota = true;
        for (var idx = 0; idx<this.Text.length; idx++)
        {
          if (this.Text.substr(idx,1)!="*")
          {
            svuota=false;
            break;
          }
        }
        //
        if (svuota)
        {
          this.IntCtrl.value = "";
          this.PwdSvuotata = true;
        }
      }
    }*/
    //
    // Se ho un tooltip di errore e il parametro e' 2 mostro tooltip
    if (this.TooltipErrorObj && !this.TooltipErrorObj.Opened && RD3_ServerParams.TooltipErrorMode == 2)
      this.TooltipErrorObj.Activate();
  }
  else
  {
    // Non posso fuocarla... dichiaro la perdita del fuoco
    this.ParentField.LostFocus(this.IntCtrl,null, true);
  }
}
